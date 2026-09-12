<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import { createEditorDocumentContext } from '../../composables/useEditorDocument';
import {
  addFloorToProject,
  getActiveFloor,
  getProject,
  rememberLastProjectId,
  saveProjectSnapshot,
  setActiveFloor,
  updateFloorMeta,
} from '../../composables/useProjects';
import type { FloorRecord, ProjectRecord } from '../../core/persistence/ProjectStore';
import { SceneDocument } from '../../core/model/SceneDocument';
import type { Opening } from '../../core/model/Opening';
import type { Room } from '../../core/model/Room';
import type { WallObject } from '../../core/model/WallObject';
import EditorCanvas2D from '../../components/EditorCanvas2D.vue';
import EditorCanvas3D from '../../components/EditorCanvas3D.vue';
import EditorInspector from '../../components/EditorInspector.vue';
import EditorMeasurements from '../../components/EditorMeasurements.vue';
import EditorScenePanel from '../../components/EditorScenePanel.vue';
import EditorToolbar from '../../components/EditorToolbar.vue';
import { useEditorHotkeys } from '../../composables/useEditorHotkeys';

const AUTOSAVE_MS = 400;

const {
  mode,
  cameraMode,
  showCeiling,
  rooms,
  document: sceneDocument,
} = createEditorDocumentContext();
useEditorHotkeys();

const route = useRoute();
const projectId = computed(() => String(route.params.projectId ?? ''));

const loadState = ref<'loading' | 'ready' | 'missing'>('loading');
const projectName = ref('');
const saveStatus = ref<'idle' | 'dirty' | 'saving' | 'saved'>('idle');
const floors = shallowRef<FloorRecord[]>([]);
const activeFloorId = ref('');
const floorElevation = ref(0);

const belowDoc = new SceneDocument();
const belowRooms = shallowRef<Room[]>([]);
const belowOpenings = shallowRef<Opening[]>([]);
const belowWallList = shallowRef<WallObject[]>([]);

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

function applyProjectRecord(record: ProjectRecord): void {
  floors.value = record.floors;
  activeFloorId.value = record.activeFloorId ?? record.floors[0]!.id;
  const floor = getActiveFloor(record);
  floorElevation.value = floor.elevation;
  showCeiling.value = floor.showCeiling === true;
  sceneDocument.fromSnapshot(floor.snapshot);
  refreshBelowFloor();
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
    saveStatus.value = 'saved';
  } else {
    saveStatus.value = 'idle';
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

watch(showCeiling, async (value) => {
  if (loadState.value !== 'ready' || !activeFloorId.value) return;
  await updateFloorMeta(projectId.value, activeFloorId.value, { showCeiling: value });
});

onMounted(() => {
  void loadProject();
});

onUnmounted(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  unsubChange?.();
  unsubSettings?.();
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
    <template v-if="loadState === 'loading'">
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
      </EditorToolbar>

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
        </main>
        <EditorInspector />
      </div>
    </template>
  </div>
</template>
