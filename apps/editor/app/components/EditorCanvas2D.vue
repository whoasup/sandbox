<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { SvgRenderer } from '../core/render/svg';
import { useEditorDocument } from '../composables/useEditorDocument';

const { objects, selectedId, settings, selectShape, moveShape } = useEditorDocument();
const containerRef = ref<HTMLDivElement | null>(null);
let renderer: SvgRenderer | null = null;

onMounted(() => {
  renderer = new SvgRenderer({
    onSelect: (id) => selectShape(id),
    onMove: (id, x, z) => moveShape(id, x, z),
  });
  if (containerRef.value) {
    renderer.mount(containerRef.value);
    renderer.render(objects.value, selectedId.value, settings.value);
  }
});

watch([objects, selectedId, settings], () => {
  renderer?.render(objects.value, selectedId.value, settings.value);
});

onUnmounted(() => {
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full" data-testid="editor-canvas-2d" />
</template>
