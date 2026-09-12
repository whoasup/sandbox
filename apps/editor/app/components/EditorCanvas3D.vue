<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ThreeRenderer } from '../core/render/three';
import { useEditorDocument } from '../composables/useEditorDocument';

const {
  objects,
  walls,
  rooms,
  openings,
  selection,
  settings,
  selectEntity,
  moveShape,
  moveWall,
  beginMoveGesture,
  endMoveGesture,
} = useEditorDocument();

const containerRef = ref<HTMLDivElement | null>(null);
let renderer: ThreeRenderer | null = null;

onMounted(() => {
  renderer = new ThreeRenderer({
    onSelect: (next) => selectEntity(next),
    onMoveShape: (id, x, z) => moveShape(id, x, z),
    onMoveWall: (id, x, z) => moveWall(id, x, z),
    onMoveGestureStart: () => beginMoveGesture(),
    onMoveGestureEnd: () => endMoveGesture(),
  });
  if (containerRef.value) {
    renderer.mount(containerRef.value);
    renderer.render(
      objects.value,
      walls.value,
      rooms.value,
      openings.value,
      selection.value,
      settings.value,
    );
  }
});

watch([objects, walls, rooms, openings, selection, settings], () => {
  renderer?.render(
    objects.value,
    walls.value,
    rooms.value,
    openings.value,
    selection.value,
    settings.value,
  );
});

onUnmounted(() => {
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full" data-testid="editor-canvas-3d" />
</template>
