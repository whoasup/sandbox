<script setup lang="ts">
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import EditorCanvas2D from '../components/EditorCanvas2D.vue';
import EditorCanvas3D from '../components/EditorCanvas3D.vue';
import EditorToolbar from '../components/EditorToolbar.vue';

const { mode } = createEditorDocumentContext();
</script>

<template>
  <div class="editor-page">
    <EditorToolbar />
    <main class="editor-page__canvas">
      <ClientOnly>
        <EditorCanvas2D v-if="mode === '2d'" />
        <EditorCanvas3D v-else />
        <template #fallback>
          <div class="editor-page__loading">Загрузка редактора…</div>
        </template>
      </ClientOnly>
    </main>
  </div>
</template>

<style scoped>
.editor-page__canvas {
  flex: 1;
  min-height: 0;
  position: relative;
}

.editor-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ui-color-text-muted);
}
</style>
