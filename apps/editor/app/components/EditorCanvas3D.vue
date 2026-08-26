<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ThreeRenderer } from '../core/render/three';
import { useEditorDocument } from '../composables/useEditorDocument';

const { objects, selectedId, selectShape, moveShape } = useEditorDocument();
const containerRef = ref<HTMLDivElement | null>(null);
let renderer: ThreeRenderer | null = null;

onMounted(() => {
  renderer = new ThreeRenderer({
    onSelect: (id) => selectShape(id),
    onMove: (id, x, z) => moveShape(id, x, z),
  });
  if (containerRef.value) {
    renderer.mount(containerRef.value);
    renderer.render(objects.value, selectedId.value);
  }
});

watch([objects, selectedId], () => {
  renderer?.render(objects.value, selectedId.value);
});

onUnmounted(() => {
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="editor-canvas-3d" data-testid="editor-canvas-3d" />
</template>

<style scoped>
.editor-canvas-3d {
  width: 100%;
  height: 100%;
}
</style>
