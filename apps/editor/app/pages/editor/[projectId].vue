<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { UiText } from '@sandbox/ui-kit';
import { createEditorDocumentContext } from '../../composables/useEditorDocument';
import {
  getProject,
  rememberLastProjectId,
  saveProjectSnapshot,
} from '../../composables/useProjects';
import EditorCanvas2D from '../../components/EditorCanvas2D.vue';
import EditorCanvas3D from '../../components/EditorCanvas3D.vue';
import EditorInspector from '../../components/EditorInspector.vue';
import EditorScenePanel from '../../components/EditorScenePanel.vue';
import EditorToolbar from '../../components/EditorToolbar.vue';

const AUTOSAVE_MS = 400;

const { mode, rooms, document: sceneDocument } = createEditorDocumentContext();

const route = useRoute();
const projectId = computed(() => String(route.params.projectId ?? ''));

const loadState = ref<'loading' | 'ready' | 'missing'>('loading');
const projectName = ref('');
const saveStatus = ref<'idle' | 'dirty' | 'saving' | 'saved'>('idle');

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubChange: (() => void) | null = null;
let unsubSettings: (() => void) | null = null;

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
  const saved = await saveProjectSnapshot(projectId.value, sceneDocument.toSnapshot());
  saveStatus.value = saved ? 'saved' : 'idle';
}

async function loadProject(): Promise<void> {
  loadState.value = 'loading';
  const record = await getProject(projectId.value);
  if (!record) {
    loadState.value = 'missing';
    return;
  }
  sceneDocument.fromSnapshot(record.snapshot);
  projectName.value = record.name;
  rememberLastProjectId(record.id);
  loadState.value = 'ready';
  saveStatus.value = 'saved';

  unsubChange?.();
  unsubSettings?.();
  unsubChange = sceneDocument.on('change', () => scheduleAutosave());
  unsubSettings = sceneDocument.on('settings', () => scheduleAutosave());
}

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
          </UiText>
        </template>
      </EditorToolbar>
      <div class="flex min-h-0 flex-1">
        <EditorScenePanel />
        <main class="relative min-h-0 min-w-0 flex-1">
          <ClientOnly>
            <EditorCanvas2D v-if="mode === '2d'" />
            <EditorCanvas3D v-else />
            <template #fallback>
              <div class="flex h-full items-center justify-center text-text-muted">
                Загрузка редактора…
              </div>
            </template>
          </ClientOnly>
        </main>
        <EditorInspector />
      </div>
    </template>
  </div>
</template>
