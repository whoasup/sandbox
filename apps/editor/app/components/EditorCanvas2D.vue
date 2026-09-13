<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { SvgRenderer } from '../core/render/svg';
import { useEditorDocument } from '../composables/useEditorDocument';

const {
  objects,
  walls,
  rooms,
  openings,
  furniture,
  stairs,
  dimensions,
  selection,
  settings,
  tool,
  planStyle,
  selectEntity,
  moveShape,
  moveWall,
  moveFurniture,
  moveStair,
  addWall,
  addDimension,
  addRoomRect,
  placePendingRoomAt,
  addOpeningAtPoint,
  addStairAtPoint,
  activateStair,
  snapPoint,
  beginMoveGesture,
  endMoveGesture,
  setWallDraftLength,
} = useEditorDocument();

const containerRef = ref<HTMLDivElement | null>(null);
let renderer: SvgRenderer | null = null;

onMounted(() => {
  renderer = new SvgRenderer({
    onSelect: (next) => selectEntity(next),
    onMoveShape: (id, x, z) => moveShape(id, x, z),
    onMoveWall: (id, x, z) => moveWall(id, x, z),
    onMoveFurniture: (id, x, z) => moveFurniture(id, x, z),
    onMoveStair: (id, x, z) => moveStair(id, x, z),
    onAddWall: (start, end) => addWall(start, end),
    onAddDimension: (start, end) => addDimension(start, end),
    onAddRoomRect: (origin, width, depth) => addRoomRect(origin, width, depth),
    onPlacePendingRoom: (point) => placePendingRoomAt(point),
    onAddOpening: (type, point, wallId) => addOpeningAtPoint(type, point, wallId),
    onAddStair: (point) => addStairAtPoint(point),
    onActivateStair: (id) => activateStair(id),
    snapPoint: (point, angleFrom) => snapPoint(point, angleFrom),
    onMoveGestureStart: () => beginMoveGesture(),
    onMoveGestureEnd: () => endMoveGesture(),
    onWallDraftLength: (length) => setWallDraftLength(length),
  });
  if (containerRef.value) {
    renderer.mount(containerRef.value);
    renderer.setTool(tool.value);
    renderer.setPlanStyle(planStyle.value);
    renderer.render(
      objects.value,
      walls.value,
      rooms.value,
      openings.value,
      furniture.value,
      stairs.value,
      dimensions.value,
      selection.value,
      settings.value,
    );
  }
});

watch([objects, walls, rooms, openings, furniture, stairs, dimensions, selection, settings], () => {
  renderer?.render(
    objects.value,
    walls.value,
    rooms.value,
    openings.value,
    furniture.value,
    stairs.value,
    dimensions.value,
    selection.value,
    settings.value,
  );
});

watch(tool, (next) => {
  renderer?.setTool(next);
});

watch(planStyle, (next) => {
  renderer?.setPlanStyle(next);
});

onUnmounted(() => {
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full" data-testid="editor-canvas-2d" />
</template>
