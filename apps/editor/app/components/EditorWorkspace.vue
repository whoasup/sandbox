<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import {
  type FloorRecord,
  type Opening,
  type ProjectRecord,
  type Room,
  type StairObjectSnapshot,
  type WallObject,
  removeStairPair,
  SceneDocument,
  upsertStairPair,
} from '@sandbox/editor-core';
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import { exportServiceKey } from '../composables/exportServiceKey';
import {
  addFloorToProject,
  exportProject,
  getActiveFloor,
  getProject,
  rememberLastProjectId,
  saveProjectRecord,
  saveProjectSnapshot,
  setActiveFloor,
  updateFloorMeta,
} from '../composables/useProjects';
import { ExportService } from '../core/export/ExportService';
import EditorCanvas2D from './EditorCanvas2D.vue';
import EditorExportMenu from './EditorExportMenu.vue';
import EditorInspector from './EditorInspector.vue';
import EditorMeasurements from './EditorMeasurements.vue';
import EditorScenePanel from './EditorScenePanel.vue';
import EditorToolbar from './EditorToolbar.vue';
import { useEditorHotkeys } from '../composables/useEditorHotkeys';

/** Keep three.js off the editor shell critical path until 3D mode mounts. */
const EditorCanvas3D = defineAsyncComponent(() => import('./EditorCanvas3D.vue'));

const AUTOSAVE_MS = 400;
const bootError = ref<string | null>(null);

/**
 * Stair pairing: each stair has a shared `linkId`. Placing/updating a stair
 * upserts a mirrored marker on the target floor; delete cleans both via
 * `removeStairPair`.
 */
let ctx: ReturnType<typeof createEditorDocumentContext> | null = null;
try {
  ctx = createEditorDocumentContext();
  useEditorHotkeys(ctx);
} catch (error) {
  bootError.value =
    error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
}

const mode = computed(() => ctx?.mode.value ?? '3d');
const cameraMode = computed(() => ctx?.cameraMode.value ?? 'orbit');
const showCeiling = computed({
  get: () => ctx?.showCeiling.value ?? false,
  set: (value: boolean) => {
    if (ctx) ctx.showCeiling.value = value;
  },
});
const rooms = computed(() => ctx?.rooms.value ?? []);
const objects = computed(() => ctx?.objects.value ?? []);
const sceneDocument = ctx?.document ?? new SceneDocument();
const clearHistory = () => ctx?.clearHistory();
const setFloorContext = (floorCtx: Parameters<NonNullable<typeof ctx>['setFloorContext']>[0]) =>
  ctx?.setFloorContext(floorCtx);
const setStairProjectHooks = (
  hooks: Parameters<NonNullable<typeof ctx>['setStairProjectHooks']>[0],
) => ctx?.setStairProjectHooks(hooks);

const route = useRoute();
const projectId = computed(() => String(route.params.projectId ?? ''));

const loadState = ref<'loading' | 'ready' | 'missing'>('loading');
const projectName = ref('');
const saveStatus = ref<'idle' | 'dirty' | 'saving' | 'saved'>('idle');
const floors = shallowRef<FloorRecord[]>([]);
const activeFloorId = ref('');
const floorElevation = ref(0);
const exportError = ref<string | null>(null);

const belowDoc = new SceneDocument();
const belowRooms = shallowRef<Room[]>([]);
const belowOpenings = shallowRef<Opening[]>([]);
const belowWallList = shallowRef<WallObject[]>([]);

const exportService = shallowRef<ExportService | null>(
  new ExportService({
    getFloor: async ({ projectId: pid, floorId }) => {
      if (
        pid === projectId.value &&
        floorId === activeFloorId.value &&
        loadState.value === 'ready'
      ) {
        const floor = floors.value.find((f) => f.id === floorId);
        return {
          projectName: projectName.value || 'project',
          floorName: floor?.name ?? 'floor',
          snapshot: sceneDocument.toSnapshot(),
        };
      }
      const record = await getProject(pid);
      if (!record) return null;
      const floor = record.floors.find((f) => f.id === floorId) ?? getActiveFloor(record);
      if (!floor) return null;
      return {
        projectName: record.name,
        floorName: floor.name,
        snapshot: floor.snapshot,
      };
    },
  }),
);
provide(exportServiceKey, exportService);

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubChange: (() => void) | null = null;
let unsubSettings: (() => void) | null = null;

function refreshBelowFloor(): void {
  const idx = floors.value.findIndex((f) => f.id === activeFloorId.value);
  if (idx <= 0) {
    belowWallList.value = [];
    belowRooms.value = [];
    belowOpenings.value = [];
    return;
  }
  const below = floors.value[idx - 1]!;
  belowDoc.fromSnapshot(below.snapshot);
  belowWallList.value = belowDoc.listWalls();
  belowRooms.value = belowDoc.listRooms();
  belowOpenings.value = belowDoc.listOpenings();
}

function syncFloorContext(): void {
  setFloorContext({
    activeFloorId: activeFloorId.value,
    floors: floors.value.map((floor) => ({ id: floor.id, name: floor.name })),
  });
}

function applyProjectRecord(record: ProjectRecord): void {
  floors.value = record.floors;
  activeFloorId.value = record.activeFloorId ?? record.floors[0]!.id;
  const floor = getActiveFloor(record);
  floorElevation.value = floor.elevation;
  showCeiling.value = floor.showCeiling === true;
  sceneDocument.fromSnapshot(floor.snapshot);
  clearHistory();
  refreshBelowFloor();
  syncFloorContext();
}

function scheduleAutosave(): void {
  if (loadState.value !== 'ready') return;
  saveStatus.value = 'dirty';
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void flushAutosave();
  }, AUTOSAVE_MS);
}

async function flushAutosave(): Promise<void> {
  if (loadState.value !== 'ready') return;
  saveStatus.value = 'saving';
  const saved = await saveProjectSnapshot(
    projectId.value,
    sceneDocument.toSnapshot(),
    undefined,
    activeFloorId.value,
  );
  if (saved) {
    floors.value = saved.floors;
    syncFloorContext();
    saveStatus.value = 'saved';
  } else {
    saveStatus.value = 'idle';
  }
}

async function persistStairUpsert(stairSnap: StairObjectSnapshot): Promise<void> {
  if (loadState.value !== 'ready') return;
  const existing = await getProject(projectId.value);
  if (!existing) return;
  const withCurrent = existing.floors.map((floor) =>
    floor.id === activeFloorId.value ? { ...floor, snapshot: sceneDocument.toSnapshot() } : floor,
  );
  const nextFloors = upsertStairPair(withCurrent, stairSnap);
  const saved = await saveProjectRecord({
    ...existing,
    floors: nextFloors,
    activeFloorId: activeFloorId.value,
  });
  floors.value = saved.floors;
  syncFloorContext();
  saveStatus.value = 'saved';
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

async function persistStairRemoved(linkId: string): Promise<void> {
  if (loadState.value !== 'ready') return;
  const existing = await getProject(projectId.value);
  if (!existing) return;
  const withCurrent = existing.floors.map((floor) =>
    floor.id === activeFloorId.value ? { ...floor, snapshot: sceneDocument.toSnapshot() } : floor,
  );
  const nextFloors = removeStairPair(withCurrent, linkId);
  const saved = await saveProjectRecord({
    ...existing,
    floors: nextFloors,
    activeFloorId: activeFloorId.value,
  });
  floors.value = saved.floors;
  syncFloorContext();
  saveStatus.value = 'saved';
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

async function loadProject(): Promise<void> {
  loadState.value = 'loading';
  const record = await getProject(projectId.value);
  if (!record) {
    loadState.value = 'missing';
    return;
  }
  projectName.value = record.name;
  applyProjectRecord(record);
  rememberLastProjectId(record.id);
  loadState.value = 'ready';
  saveStatus.value = 'saved';

  unsubChange?.();
  unsubSettings?.();
  unsubChange = sceneDocument.on('change', () => scheduleAutosave());
  unsubSettings = sceneDocument.on('settings', () => scheduleAutosave());
}

async function switchFloor(floorId: string): Promise<void> {
  if (floorId === activeFloorId.value) return;
  await flushAutosave();
  const updated = await setActiveFloor(projectId.value, floorId, sceneDocument.toSnapshot());
  if (!updated) return;
  applyProjectRecord(updated);
  saveStatus.value = 'saved';
}

async function addFloor(): Promise<void> {
  await flushAutosave();
  const updated = await addFloorToProject(projectId.value);
  if (!updated) return;
  applyProjectRecord(updated);
  saveStatus.value = 'saved';
}

async function onExportJson(): Promise<void> {
  exportError.value = null;
  try {
    await flushAutosave();
    await exportProject(projectId.value);
  } catch (error) {
    exportError.value = error instanceof Error ? error.message : 'Ошибка экспорта JSON';
  }
}

function onExportError(message: string): void {
  exportError.value = message;
}

watch(showCeiling, async (value) => {
  if (loadState.value !== 'ready' || !activeFloorId.value) return;
  await updateFloorMeta(projectId.value, activeFloorId.value, { showCeiling: value });
});

setStairProjectHooks({
  onStairUpsert: (stairSnap) => {
    void persistStairUpsert(stairSnap);
  },
  onStairRemoved: (linkId) => {
    void persistStairRemoved(linkId);
  },
  onActivateStair: (stairId) => {
    const stair = sceneDocument.getStair(stairId);
    if (stair) void switchFloor(stair.targetFloorId);
  },
});

onMounted(() => {
  if (!bootError.value) void loadProject();
});

onUnmounted(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  unsubChange?.();
  unsubSettings?.();
  exportService.value?.setLivePngCapture(null);
});

const statusLabel = computed(() => {
  switch (saveStatus.value) {
    case 'dirty':
      return 'Изменения…';
    case 'saving':
      return 'Сохранение…';
    case 'saved':
      return 'Сохранено';
    default:
      return '';
  }
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-sunken" data-testid="editor-page">
    <div
      v-if="bootError"
      class="whitespace-pre-wrap p-6 text-sm text-danger"
      data-testid="editor-boot-error"
    >
      {{ bootError }}
    </div>

    <template v-else-if="loadState === 'loading'">
      <div class="flex flex-1 items-center justify-center text-text-muted">Загрузка проекта…</div>
    </template>

    <template v-else-if="loadState === 'missing'">
      <div
        class="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center"
        data-testid="editor-not-found"
      >
        <UiText size="lg" weight="bold" as="h1">Проект не найден</UiText>
        <UiText size="sm" tone="muted" as="p">
          Нет локальной записи с id «{{ projectId }}». Возможно, она была удалена.
        </UiText>
        <NuxtLink
          to="/"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary no-underline"
        >
          К списку проектов
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <EditorToolbar :project-id="projectId">
        <template #status>
          <UiText size="xs" tone="muted" as="span" data-testid="editor-save-status">
            {{ projectName }} · {{ statusLabel
            }}<template v-if="rooms.length"> · Комнат: {{ rooms.length }}</template>
            <template v-if="cameraMode === 'walk'"> · WASD · Esc — орбита</template>
          </UiText>
        </template>
        <template #export>
          <EditorExportMenu
            :export-service="exportService"
            :project-id="projectId"
            :floor-id="activeFloorId"
            :disabled="loadState !== 'ready'"
            @export-json="onExportJson"
            @error="onExportError"
          />
        </template>
      </EditorToolbar>

      <UiText
        v-if="exportError"
        size="xs"
        as="p"
        class="border-b border-border bg-surface px-5 py-1 text-danger"
        data-testid="export-error"
      >
        {{ exportError }}
      </UiText>

      <div
        class="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-5 py-2"
        data-testid="floor-switcher"
      >
        <UiText size="xs" tone="muted" as="span">Этажи</UiText>
        <UiButton
          v-for="floor in floors"
          :key="floor.id"
          size="sm"
          :variant="floor.id === activeFloorId ? 'primary' : 'secondary'"
          @click="switchFloor(floor.id)"
        >
          {{ floor.name }}
        </UiButton>
        <UiButton size="sm" variant="ghost" @click="addFloor">+ Этаж</UiButton>
      </div>

      <div class="flex min-h-0 flex-1">
        <EditorScenePanel />
        <main class="relative min-h-0 min-w-0 flex-1">
          <ClientOnly>
            <EditorCanvas2D v-if="mode === '2d'" />
            <EditorCanvas3D
              v-else
              :floor-elevation="floorElevation"
              :below-walls="belowWallList"
              :below-rooms="belowRooms"
              :below-openings="belowOpenings"
            />
            <template #fallback>
              <div class="flex h-full items-center justify-center text-text-muted">
                Загрузка редактора…
              </div>
            </template>
          </ClientOnly>
          <EditorMeasurements />
          <!-- E2E / a11y: mirror placed shapes for stable testid queries -->
          <ul class="sr-only" data-testid="scene-shapes" aria-hidden="true">
            <li
              v-for="obj in objects"
              :key="obj.id"
              data-testid="scene-shape"
              :data-kind="obj.kind"
              :data-shape-id="obj.id"
            />
          </ul>
        </main>
        <EditorInspector />
      </div>
    </template>
  </div>
</template>
