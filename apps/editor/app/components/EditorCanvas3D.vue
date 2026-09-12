<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ThreeRenderer } from '../core/render/three';
import { useEditorDocument } from '../composables/useEditorDocument';
import { exportServiceKey } from '../composables/exportServiceKey';

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
  furniture,
  stairs,
  selection,
  settings,
  cameraMode,
  showCeiling,
  selectEntity,
  moveShape,
  moveWall,
  moveFurniture,
  moveStair,
  activateStair,
  beginMoveGesture,
  endMoveGesture,
} = useEditorDocument();

const exportServiceRef = inject(exportServiceKey, null);

const containerRef = ref<HTMLDivElement | null>(null);
let renderer: ThreeRenderer | null = null;
let disposed = false;

onMounted(async () => {
  const { ThreeRenderer: ThreeRendererCtor } = await import('../core/render/three');
  if (disposed) return;

  renderer = new ThreeRendererCtor({
    onSelect: (next) => selectEntity(next),
    onMoveShape: (id, x, z) => moveShape(id, x, z),
    onMoveWall: (id, x, z) => moveWall(id, x, z),
    onMoveFurniture: (id, x, z) => moveFurniture(id, x, z),
    onMoveStair: (id, x, z) => moveStair(id, x, z),
    onActivateStair: (id) => activateStair(id),
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
      furniture.value,
      stairs.value,
      selection.value,
      settings.value,
    );
  }
  exportServiceRef?.value?.setLivePngCapture(() => {
    if (!renderer) return Promise.reject(new Error('3D renderer is not mounted'));
    return renderer.capturePng();
  });
});

watch([objects, walls, rooms, openings, furniture, stairs, selection, settings], () => {
  renderer?.render(
    objects.value,
    walls.value,
    rooms.value,
    openings.value,
    furniture.value,
    stairs.value,
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
  disposed = true;
  exportServiceRef?.value?.setLivePngCapture(null);
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full" data-testid="editor-canvas-3d" />
</template>
