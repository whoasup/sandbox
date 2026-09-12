<script setup lang="ts">
import { computed } from 'vue';
import {
  clamp,
  getFurniturePreset,
  SHAPE_CATALOG,
  TEXTURE_LIST,
  UiButton,
  UiShapeIcon,
  UiText,
  UiTextureSwatch,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';
import type { StairDirection } from '../core/model/StairObject';

const {
  objects,
  walls,
  rooms,
  openings,
  furniture,
  stairs,
  selection,
  floorOptions,
  activeFloorId,
  activeSurface,
  activeColor,
  replaceSelectedKind,
  setSelectedRotation,
  setSelectedScale,
  setSelectedWallHeight,
  setSelectedWallThickness,
  setSelectedRoomName,
  updateSelectedOpening,
  updateSelectedStair,
  activateStair,
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

const selectedOpening = computed(() => {
  if (selection.value?.type !== 'opening') return null;
  return openings.value.find((opening) => opening.id === selection.value!.id) ?? null;
});

const selectedFurniture = computed(() => {
  if (selection.value?.type !== 'furniture') return null;
  return furniture.value.find((item) => item.id === selection.value!.id) ?? null;
});

const selectedStair = computed(() => {
  if (selection.value?.type !== 'stair') return null;
  return stairs.value.find((item) => item.id === selection.value!.id) ?? null;
});

const furnitureLabel = computed(() => {
  if (!selectedFurniture.value) return '';
  return getFurniturePreset(selectedFurniture.value.catalogId).label;
});

const stairTargetOptions = computed(() =>
  floorOptions.value.filter(
    (floor) => floor.id !== (selectedStair.value?.floorId ?? activeFloorId.value),
  ),
);

const rotationDegrees = computed({
  get: () =>
    Math.round(
      (((selectedShape.value ?? selectedFurniture.value)?.rotationY ?? 0) * 180) / Math.PI,
    ),
  set: (degrees: number) => {
    setSelectedRotation((degrees * Math.PI) / 180);
  },
});

const scaleValue = computed({
  get: () => (selectedShape.value ?? selectedFurniture.value)?.scale ?? 1,
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

const stairTargetFloorId = computed({
  get: () => selectedStair.value?.targetFloorId ?? '',
  set: (value: string) => updateSelectedStair({ targetFloorId: value }),
});

const stairWidth = computed({
  get: () => selectedStair.value?.width ?? 1,
  set: (value: number) => updateSelectedStair({ width: clamp(value, 0.4, 4) }),
});

const stairDepth = computed({
  get: () => selectedStair.value?.depth ?? 2.5,
  set: (value: number) => updateSelectedStair({ depth: clamp(value, 0.8, 8) }),
});

const stairStepCount = computed({
  get: () => selectedStair.value?.stepCount ?? 12,
  set: (value: number) => updateSelectedStair({ stepCount: Math.round(clamp(value, 3, 40)) }),
});

const stairDirection = computed({
  get: () => selectedStair.value?.direction ?? 'up',
  set: (value: StairDirection) => updateSelectedStair({ direction: value }),
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

const openingWidth = computed({
  get: () => selectedOpening.value?.width ?? 0.9,
  set: (value: number) => updateSelectedOpening({ width: clamp(value, 0.1, 10) }),
});
const openingHeight = computed({
  get: () => selectedOpening.value?.height ?? 2.1,
  set: (value: number) => updateSelectedOpening({ height: clamp(value, 0.3, 10) }),
});
const openingSill = computed({
  get: () => selectedOpening.value?.sill ?? 0,
  set: (value: number) => updateSelectedOpening({ sill: clamp(value, 0, 5) }),
});
const openingT = computed({
  get: () => selectedOpening.value?.t ?? 0.5,
  set: (value: number) => updateSelectedOpening({ t: clamp(value, 0, 1) }),
});

function onOpeningWidthInput(event: Event): void {
  openingWidth.value = Number((event.target as HTMLInputElement).value);
}
function onOpeningHeightInput(event: Event): void {
  openingHeight.value = Number((event.target as HTMLInputElement).value);
}
function onOpeningSillInput(event: Event): void {
  openingSill.value = Number((event.target as HTMLInputElement).value);
}
function onOpeningTInput(event: Event): void {
  openingT.value = Number((event.target as HTMLInputElement).value);
}

function onStairTargetChange(event: Event): void {
  stairTargetFloorId.value = (event.target as HTMLSelectElement).value;
}

function onStairWidthInput(event: Event): void {
  stairWidth.value = Number((event.target as HTMLInputElement).value);
}

function onStairDepthInput(event: Event): void {
  stairDepth.value = Number((event.target as HTMLInputElement).value);
}

function onStairStepCountInput(event: Event): void {
  stairStepCount.value = Number((event.target as HTMLInputElement).value);
}

function onStairDirectionChange(event: Event): void {
  stairDirection.value = (event.target as HTMLSelectElement).value as StairDirection;
}

function onActivateStair(): void {
  if (selectedStair.value) activateStair(selectedStair.value.id);
}
</script>

<template>
  <aside
    class="editor-inspector flex w-64 shrink-0 flex-col gap-4 border-l border-border bg-surface p-4"
    data-testid="editor-inspector"
  >
    <UiText weight="bold" as="h2">Инспектор</UiText>

    <template v-if="selectedShape">
      <div class="flex flex-col gap-2" data-testid="shape-inspector">
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

    <template v-else-if="selectedFurniture">
      <div class="flex flex-col gap-1" data-testid="furniture-inspector">
        <UiText size="xs" tone="muted" as="span">Мебель</UiText>
        <UiText size="sm" as="p">{{ furnitureLabel }}</UiText>
        <UiText size="xs" tone="muted" as="span"
          >Каталог · {{ selectedFurniture.catalogId }}</UiText
        >
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

    <template v-else-if="selectedStair">
      <div class="flex flex-col gap-1" data-testid="stair-inspector">
        <UiText size="xs" tone="muted" as="span">Лестница</UiText>
        <UiText size="sm" as="p">
          {{ selectedStair.direction === 'up' ? 'Вверх' : 'Вниз' }}
        </UiText>
      </div>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">На этаж</UiText>
        <select
          class="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
          :value="stairTargetFloorId"
          data-testid="stair-target-floor"
          @change="onStairTargetChange"
        >
          <option v-for="floor in stairTargetOptions" :key="floor.id" :value="floor.id">
            {{ floor.name }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Ширина · {{ stairWidth.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.4"
          max="3"
          step="0.05"
          :value="stairWidth"
          @input="onStairWidthInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Глубина · {{ stairDepth.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.8"
          max="6"
          step="0.05"
          :value="stairDepth"
          @input="onStairDepthInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Ступени · {{ stairStepCount }}</UiText>
        <input
          type="range"
          min="3"
          max="30"
          step="1"
          :value="stairStepCount"
          @input="onStairStepCountInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Направление</UiText>
        <select
          class="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
          :value="stairDirection"
          @change="onStairDirectionChange"
        >
          <option value="up">Вверх</option>
          <option value="down">Вниз</option>
        </select>
      </label>

      <div class="mt-auto flex flex-col gap-2">
        <UiButton variant="secondary" data-testid="stair-activate" @click="onActivateStair"
          >Перейти</UiButton
        >
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

    <template v-else-if="selectedOpening">
      <div class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Проём</UiText>
        <UiText size="sm" as="p">
          {{ selectedOpening.type === 'door' ? 'Дверь' : 'Окно' }}
        </UiText>
      </div>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Ширина · {{ openingWidth.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.05"
          :value="openingWidth"
          @input="onOpeningWidthInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Высота · {{ openingHeight.toFixed(2) }} м</UiText>
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.05"
          :value="openingHeight"
          @input="onOpeningHeightInput"
        />
      </label>

      <label v-if="selectedOpening.type === 'window'" class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span"
          >Подоконник · {{ openingSill.toFixed(2) }} м</UiText
        >
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          :value="openingSill"
          @input="onOpeningSillInput"
        />
      </label>

      <label class="flex flex-col gap-1">
        <UiText size="xs" tone="muted" as="span">Позиция t · {{ openingT.toFixed(2) }}</UiText>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="openingT"
          @input="onOpeningTInput"
        />
      </label>

      <div class="mt-auto flex flex-col gap-2">
        <UiButton variant="ghost" @click="removeSelected">Удалить</UiButton>
      </div>
    </template>

    <UiText v-else size="sm" tone="muted" as="p">Выберите объект на сцене</UiText>
  </aside>
</template>
