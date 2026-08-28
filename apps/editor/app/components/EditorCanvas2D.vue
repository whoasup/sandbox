<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { SvgRenderer } from '../core/render/svg';
import { useEditorDocument } from '../composables/useEditorDocument';

const { objects, selectedId, selectShape, moveShape } = useEditorDocument();
const containerRef = ref<HTMLDivElement | null>(null);
let renderer: SvgRenderer | null = null;

onMounted(() => {
  renderer = new SvgRenderer({
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
  <div ref="containerRef" class="editor-canvas-2d" data-testid="editor-canvas-2d" />
</template>

<style scoped>
.editor-canvas-2d {
  width: 100%;
  height: 100%;
}
</style>
