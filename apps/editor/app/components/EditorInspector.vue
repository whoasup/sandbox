<script setup lang="ts">
import { computed } from 'vue';
import {
  clamp,
  SHAPE_CATALOG,
  UiButton,
  UiShapeIcon,
  UiText,
  UiTextureSwatch,
  TEXTURE_LIST,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const {
  objects,
  walls,
  rooms,
  selection,
  activeSurface,
  activeColor,
  replaceSelectedKind,
  setSelectedRotation,
  setSelectedScale,
  setSelectedWallHeight,
  setSelectedWallThickness,
  setSelectedRoomName,
  applySurfaceToSelection,
  applyColorToSelection,
  duplicateSelected,
  removeSelected,
} = useEditorDocument();

const selectedShape = computed(() => {
  if (selection.value?.type !== 'shape') return null;
  return objects.value.find((object) => object.id === selection.value!.id) ?? null;
});

const selectedWall = computed(() => {
  if (selection.value?.type !== 'wall') return null;
  return walls.value.find((wall) => wall.id === selection.value!.id) ?? null;
});

const selectedRoom = computed(() => {
  if (selection.value?.type !== 'room') return null;
  return rooms.value.find((room) => room.id === selection.value!.id) ?? null;
});

const rotationDegrees = computed({
  get: () => Math.round(((selectedShape.value?.rotationY ?? 0) * 180) / Math.PI),
  set: (degrees: number) => {
    setSelectedRotation((degrees * Math.PI) / 180);
  },
});

const scaleValue = computed({
  get: () => selectedShape.value?.scale ?? 1,
  set: (value: number) => {
    setSelectedScale(clamp(value, 0.25, 4));
  },
});

const wallHeight = computed({
  get: () => selectedWall.value?.height ?? 2.5,
  set: (value: number) => {
    setSelectedWallHeight(clamp(value, 0.5, 10));
  },
});

const wallThickness = computed({
  get: () => selectedWall.value?.thickness ?? 0.2,
  set: (value: number) => {
    setSelectedWallThickness(clamp(value, 0.05, 2));
  },
});

const wallLengthLabel = computed(() => {
  const length = selectedWall.value?.length ?? 0;
  return `${length.toFixed(2)} м`;
});

const roomName = computed({
  get: () => selectedRoom.value?.name ?? '',
  set: (value: string) => {
    setSelectedRoomName(value);
  },
});

function onRotationInput(event: Event): void {
  rotationDegrees.value = Number((event.target as HTMLInputElement).value);
}

function onScaleInput(event: Event): void {
  scaleValue.value = Number((event.target as HTMLInputElement).value);
}

function onWallHeightInput(event: Event): void {
  wallHeight.value = Number((event.target as HTMLInputElement).value);
}

function onWallThicknessInput(event: Event): void {
  wallThickness.value = Number((event.target as HTMLInputElement).value);
}

function onColorInput(event: Event): void {
  applyColorToSelection((event.target as HTMLInputElement).value);
}

function onRoomNameInput(event: Event): void {
  roomName.value = (event.target as HTMLInputElement).value;
}
</script>

<template>
  <aside
    class="editor-inspector flex w-64 shrink-0 flex-col gap-4 border-l border-border bg-surface p-4"
    data-testid="editor-inspector"
  >
    <UiText weight="bold" as="h2">Инспектор</UiText>

    <template v-if="selectedShape">
      <div class="flex flex-col gap-2">
        <UiText size="xs" tone="muted" as="span">Фигура</UiText>
        <div class="flex flex-wrap gap-1">
          <UiButton
            v-for="shape in SHAPE_CATALOG"
            :key="shape.kind"
            size="sm"
            :variant="selectedShape.kind === shape.kind ? 'primary' : 'secondary'"
            :pressed="selectedShape.kind === shape.kind"
            :title="shape.label"
            @click="replaceSelectedKind(shape.kind)"
          >
            <template #icon>
              <UiShapeIcon :kind="shape.kind" :size="16" />
            </template>
          </UiButton>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <UiText size="xs" tone="muted" as="span">Поверхность</UiText>
        <div class="flex flex-wrap items-center gap-2">
          <UiTextureSwatch
            v-for="texture in TEXTURE_LIST"
            :key="texture.id"
            :surface="texture.id"
            :size="28"
            :selected="activeSurface === texture.id"
            :label="texture.label"
            @click="applySurfaceToSelection(texture.id)"
          />
          <input
            class="h-7 w-7 cursor-pointer rounded-sm border border-border bg-none p-0"
            type="color"
            :value="activeColor"
            title="Цвет"
            @input="onColorInput"
          />
        </div>
      </div>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Поворот Y · {{ rotationDegrees }}°</UiText>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          :value="rotationDegrees"
          @input="onRotationInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Масштаб · {{ scaleValue.toFixed(2) }}</UiText>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.05"
          :value="scaleValue"
          @input="onScaleInput"
        />
      </label>

      <div class="mt-auto flex flex-col gap-2">
        <UiButton variant="secondary" @click="duplicateSelected">Дублировать</UiButton>
        <UiButton variant="ghost" @click="removeSelected">Удалить</UiButton>
      </div>
    </template>

    <template v-else-if="selectedWall">
      <div class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Стена</UiText>
        <UiText size="sm" as="p">Длина · {{ wallLengthLabel }}</UiText>
      </div>

      <div class="flex flex-col gap-2">
        <UiText size="xs" tone="muted" as="span">Поверхность</UiText>
        <div class="flex flex-wrap items-center gap-2">
          <UiTextureSwatch
            v-for="texture in TEXTURE_LIST"
            :key="texture.id"
            :surface="texture.id"
            :size="28"
            :selected="activeSurface === texture.id"
            :label="texture.label"
            @click="applySurfaceToSelection(texture.id)"
          />
          <input
            class="h-7 w-7 cursor-pointer rounded-sm border border-border bg-none p-0"
            type="color"
            :value="activeColor"
            title="Цвет"
            @input="onColorInput"
          />
        </div>
      </div>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Высота · {{ wallHeight.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.5"
          max="6"
          step="0.05"
          :value="wallHeight"
          @input="onWallHeightInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Толщина · {{ wallThickness.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.01"
          :value="wallThickness"
          @input="onWallThicknessInput"
        />
      </label>

      <div class="mt-auto flex flex-col gap-2">
        <UiButton variant="ghost" @click="removeSelected">Удалить</UiButton>
      </div>
    </template>

    <template v-else-if="selectedRoom">
      <div class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Комната</UiText>
        <input
          class="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
          type="text"
          :value="roomName"
          data-testid="room-name-input"
          @input="onRoomNameInput"
        />
      </div>

      <div class="flex flex-col gap-2">
        <UiText size="xs" tone="muted" as="span">Пол</UiText>
        <div class="flex flex-wrap items-center gap-2">
          <UiTextureSwatch
            v-for="texture in TEXTURE_LIST"
            :key="texture.id"
            :surface="texture.id"
            :size="28"
            :selected="activeSurface === texture.id"
            :label="texture.label"
            @click="applySurfaceToSelection(texture.id)"
          />
          <input
            class="h-7 w-7 cursor-pointer rounded-sm border border-border bg-none p-0"
            type="color"
            :value="activeColor"
            title="Цвет пола"
            @input="onColorInput"
          />
        </div>
      </div>
    </template>

    <UiText v-else size="sm" tone="muted" as="p">Выберите объект на сцене</UiText>
  </aside>
</template>
