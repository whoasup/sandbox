<script setup lang="ts">
import { createEditorDocumentContext } from '../../composables/useEditorDocument';
import EditorCanvas2D from '../../components/EditorCanvas2D.vue';
import EditorCanvas3D from '../../components/EditorCanvas3D.vue';
import EditorToolbar from '../../components/EditorToolbar.vue';

// Document context lives only on the editor route (Epic 01).
const { mode } = createEditorDocumentContext();

const route = useRoute();
const projectId = computed(() => String(route.params.projectId ?? 'draft'));
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-surface-sunken" data-testid="editor-page">
    <EditorToolbar :project-id="projectId" />
    <main class="relative min-h-0 flex-1">
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
  </div>
</template>
