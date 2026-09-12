<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import type { ProjectRecord } from '@sandbox/editor-core';
import {
  createProject,
  deleteProject,
  duplicateProject,
  exportProject,
  formatRelativeUpdatedAt,
  importProjectFromJson,
  listProjects,
  renameProject,
} from '../composables/useProjects';

const router = useRouter();

const projects = ref<ProjectRecord[]>([]);
const loading = ref(true);
const errorMessage = ref('');

async function refresh(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    projects.value = await listProjects();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось загрузить проекты';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void refresh();
});

async function onCreate(): Promise<void> {
  const record = await createProject();
  await router.push(`/editor/${record.id}`);
}

async function onRename(project: ProjectRecord): Promise<void> {
  const next = window.prompt('Название проекта', project.name);
  if (next === null) return;
  await renameProject(project.id, next);
  await refresh();
}

async function onDuplicate(project: ProjectRecord): Promise<void> {
  await duplicateProject(project.id);
  await refresh();
}

async function onDelete(project: ProjectRecord): Promise<void> {
  const ok = window.confirm(`Удалить проект «${project.name}»?`);
  if (!ok) return;
  await deleteProject(project.id);
  await refresh();
}

async function onExport(project: ProjectRecord): Promise<void> {
  await exportProject(project.id);
}

async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const record = await importProjectFromJson(text);
    await refresh();
    await router.push(`/editor/${record.id}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось импортировать проект';
  }
}
</script>

<template>
  <div class="mx-auto flex h-full max-w-3xl flex-col gap-6 p-8" data-testid="projects-page">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <UiText size="lg" weight="bold" as="h1">Проекты</UiText>
        <UiText size="sm" tone="muted" as="p" class="mt-1">
          Локальная библиотека в IndexedDB. Экспорт — один JSON-файл на проект.
        </UiText>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="inline-flex cursor-pointer">
          <input
            class="sr-only"
            type="file"
            accept="application/json,.json"
            data-testid="projects-import-input"
            @change="onImportFile"
          />
          <span
            class="inline-flex items-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-surface-raised"
          >
            Импорт
          </span>
        </label>
        <UiButton variant="primary" size="sm" data-testid="projects-create" @click="onCreate">
          Создать проект
        </UiButton>
      </div>
    </div>

    <UiText v-if="errorMessage" size="sm" tone="danger" as="p" data-testid="projects-error">
      {{ errorMessage }}
    </UiText>

    <div v-if="loading" class="text-text-muted">Загрузка…</div>

    <div
      v-else-if="projects.length === 0"
      class="rounded-lg border border-dashed border-border bg-surface p-8 text-center"
      data-testid="projects-empty"
    >
      <UiText weight="bold" as="p">Пока нет проектов</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-2">
        Создайте первый проект или импортируйте JSON.
      </UiText>
      <UiButton class="mt-4" variant="primary" size="sm" @click="onCreate">Создать проект</UiButton>
    </div>

    <ul v-else class="flex list-none flex-col gap-3 p-0" data-testid="projects-list">
      <li
        v-for="project in projects"
        :key="project.id"
        class="rounded-lg border border-border bg-surface p-5 shadow-sm"
        :data-testid="`project-card-${project.id}`"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <UiText weight="bold" as="p">{{ project.name }}</UiText>
            <UiText size="sm" tone="muted" as="p" class="mt-1">
              {{ formatRelativeUpdatedAt(project.updatedAt) }} · {{ project.floors.length }} эт. ·
              {{ project.floors.reduce((sum, floor) => sum + floor.snapshot.objects.length, 0) }}
              объектов
            </UiText>
          </div>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              :to="`/editor/${project.id}`"
              class="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-text-on-primary no-underline"
            >
              Открыть
            </NuxtLink>
            <UiButton variant="secondary" size="sm" @click="onRename(project)"
              >Переименовать</UiButton
            >
            <UiButton variant="secondary" size="sm" @click="onDuplicate(project)">
              Дублировать
            </UiButton>
            <UiButton variant="secondary" size="sm" @click="onExport(project)">Экспорт</UiButton>
            <UiButton variant="ghost" size="sm" @click="onDelete(project)">Удалить</UiButton>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
