<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ThreeRenderer } from '../core/render/three';
import { useEditorDocument } from '../composables/useEditorDocument';

const props = defineProps<{
  floorElevation?: number;
  belowWalls?: unknown;
  belowRooms?: unknown;
  belowOpenings?: unknown;
}>();

const {
  objects,
  walls,
  rooms,
  openings,
  selection,
  settings,
  cameraMode,
  showCeiling,
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
    onCameraModeChange: (mode) => {
      cameraMode.value = mode;
    },
  });
  if (containerRef.value) {
    renderer.mount(containerRef.value);
    renderer.setFloorElevation(props.floorElevation ?? 0);
    renderer.setShowCeiling(showCeiling.value);
    renderer.setCameraMode(cameraMode.value);
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

watch(cameraMode, (mode) => {
  renderer?.setCameraMode(mode);
});

watch(showCeiling, (show) => {
  renderer?.setShowCeiling(show);
});

watch(
  () => props.floorElevation,
  (elevation) => {
    renderer?.setFloorElevation(elevation ?? 0);
  },
);

watch(
  () => [props.belowWalls, props.belowRooms, props.belowOpenings] as const,
  () => {
    renderer?.setBelowFloor(
      (props.belowWalls as never) ?? [],
      (props.belowRooms as never) ?? [],
      (props.belowOpenings as never) ?? [],
    );
  },
  { deep: true },
);

onUnmounted(() => {
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full" data-testid="editor-canvas-3d" />
</template>
