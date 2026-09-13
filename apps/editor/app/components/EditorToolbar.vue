<script setup lang="ts">
import { computed, watch } from 'vue';
import {
  SHAPE_CATALOG,
  TEXTURE_LIST,
  UiButton,
  UiShapeIcon,
  UiText,
  UiTextureSwatch,
  UiToggleGroup,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';
import { useViewportLg } from '../composables/useViewportLg';

const props = withDefaults(
  defineProps<{
    /** Active project id from the route. */
    projectId?: string;
  }>(),
  { projectId: '' },
);

const {
  mode,
  cameraMode,
  showCeiling,
  tool,
  wallDefaults,
  activeSurface,
  activeColor,
  selection,
  canUndo,
  canRedo,
  addShape,
  removeSelected,
  applySurfaceToSelection,
  applyColorToSelection,
  undo,
  redo,
} = useEditorDocument();

const { isLgLayout } = useViewportLg();

const modeOptions = [
  { value: '2d' as const, label: '2D' },
  { value: '3d' as const, label: '3D' },
];

const cameraOptions = [
  { value: 'orbit' as const, label: 'Орбита' },
  { value: 'top' as const, label: 'Сверху' },
  { value: 'walk' as const, label: 'Ходьба' },
];

const toolOptionsFull = [
  { value: 'select' as const, label: 'Выбор' },
  { value: 'wall' as const, label: 'Стена' },
  { value: 'door' as const, label: 'Дверь' },
  { value: 'window' as const, label: 'Окно' },
  { value: 'stair' as const, label: 'Лестница' },
];

const toolOptionsShort = [
  { value: 'select' as const, label: 'Выбор' },
  { value: 'wall' as const, label: 'Стена' },
  { value: 'door' as const, label: 'Дверь' },
  { value: 'window' as const, label: 'Окно' },
  { value: 'stair' as const, label: 'Лестн.' },
];

const toolOptions = computed(() => (isLgLayout.value ? toolOptionsFull : toolOptionsShort));

const hasSelection = computed(() => selection.value !== null);
const showWallDefaults = computed(() => tool.value === 'wall' && mode.value === '2d');
const showCamera = computed(() => mode.value === '3d');
const toggleTouchClass = '[&_button]:min-h-11 lg:[&_button]:min-h-0';

/** Draw tools only work in the 2D plan — switch automatically. */
watch(tool, (next) => {
  if (next === 'wall' || next === 'door' || next === 'window' || next === 'stair') {
    mode.value = '2d';
  }
});

function onColorInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  applyColorToSelection(value);
}

function onWallHeightInput(event: Event): void {
  wallDefaults.height = Math.max(0.5, Number((event.target as HTMLInputElement).value) || 2.5);
}

function onWallThicknessInput(event: Event): void {
  wallDefaults.thickness = Math.max(0.05, Number((event.target as HTMLInputElement).value) || 0.2);
}

function toggleCeiling(): void {
  showCeiling.value = !showCeiling.value;
}
</script>

<template>
  <header
    class="editor-toolbar flex min-w-0 flex-col gap-2 border-b border-border bg-surface px-3 py-2 shadow-sm sm:px-4 lg:gap-3 lg:px-5 lg:py-3"
    data-testid="editor-toolbar"
  >
    <div class="hidden items-baseline gap-2 lg:flex">
      <UiText size="lg" weight="bold" as="h1">Планировщик</UiText>
      <UiText
        v-if="props.projectId"
        size="xs"
        tone="muted"
        as="span"
        class="max-w-[12rem] truncate"
        >{{ props.projectId }}</UiText
      >
    </div>
    <div class="hidden min-w-0 lg:block">
      <slot name="status" />
    </div>

    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <UiToggleGroup v-model="mode" :options="modeOptions" size="sm" :class="toggleTouchClass" />
      <UiToggleGroup
        v-if="showCamera && isLgLayout"
        v-model="cameraMode"
        :options="cameraOptions"
        size="sm"
        :class="toggleTouchClass"
      />
      <UiToggleGroup
        v-model="tool"
        :options="toolOptions"
        size="sm"
        class="min-w-0"
        :class="toggleTouchClass"
      />
      <UiButton
        v-if="showCamera && isLgLayout"
        size="sm"
        class="min-h-11 lg:min-h-0"
        :variant="showCeiling ? 'primary' : 'secondary'"
        @click="toggleCeiling"
      >
        Потолок
      </UiButton>

      <div class="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <slot name="export" />
        <UiButton
          variant="ghost"
          size="sm"
          class="min-h-11 lg:min-h-0"
          :disabled="!canUndo"
          title="Ctrl+Z"
          @click="undo"
          >Отменить</UiButton
        >
        <UiButton
          variant="ghost"
          size="sm"
          class="min-h-11 lg:min-h-0"
          :disabled="!canRedo"
          title="Ctrl+Y"
          @click="redo"
          >Повтор</UiButton
        >
        <UiButton
          variant="ghost"
          size="sm"
          class="min-h-11 lg:min-h-0"
          :disabled="!hasSelection"
          @click="removeSelected"
          >Удалить</UiButton
        >
      </div>
    </div>

    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <div class="flex flex-wrap items-center gap-1 sm:gap-2">
        <UiText v-if="isLgLayout" size="xs" tone="muted" as="span">Фигуры</UiText>
        <UiButton
          v-for="shape in SHAPE_CATALOG"
          :key="shape.kind"
          variant="secondary"
          size="sm"
          class="min-h-11 lg:min-h-0 lg:text-sm"
          :title="shape.label"
          :data-testid="`add-shape-${shape.kind}`"
          @click="addShape(shape.kind)"
        >
          <template #icon>
            <UiShapeIcon :kind="shape.kind" :size="20" />
          </template>
          <span class="hidden sm:inline">{{ shape.label }}</span>
        </UiButton>
      </div>

      <div class="flex items-center gap-2">
        <UiText v-if="isLgLayout" size="xs" tone="muted" as="span">Поверхность</UiText>
        <UiTextureSwatch
          v-for="texture in TEXTURE_LIST"
          :key="texture.id"
          :surface="texture.id"
          :size="isLgLayout ? 34 : 28"
          :selected="activeSurface === texture.id"
          :label="texture.label"
          :title="texture.label"
          @click="applySurfaceToSelection(texture.id)"
        />
        <input
          class="h-7 w-7 cursor-pointer rounded-sm border border-border bg-none p-0 lg:h-[34px] lg:w-[34px]"
          type="color"
          :value="activeColor"
          title="Цвет"
          @input="onColorInput"
        />
      </div>

      <template v-if="showCamera && !isLgLayout">
        <UiToggleGroup
          v-model="cameraMode"
          :options="cameraOptions"
          size="sm"
          :class="toggleTouchClass"
        />
        <UiButton
          size="sm"
          class="min-h-11"
          :variant="showCeiling ? 'primary' : 'secondary'"
          @click="toggleCeiling"
        >
          Потолок
        </UiButton>
      </template>

      <div v-if="showWallDefaults" class="flex items-center gap-3">
        <UiText v-if="isLgLayout" size="xs" tone="muted" as="span">Стена</UiText>
        <label class="flex items-center gap-1 text-xs text-text-muted">
          H
          <input
            class="w-16 rounded-sm border border-border bg-surface px-1 py-0.5 text-sm"
            type="number"
            min="0.5"
            step="0.1"
            :value="wallDefaults.height"
            @input="onWallHeightInput"
          />
        </label>
        <label class="flex items-center gap-1 text-xs text-text-muted">
          T
          <input
            class="w-16 rounded-sm border border-border bg-surface px-1 py-0.5 text-sm"
            type="number"
            min="0.05"
            step="0.05"
            :value="wallDefaults.thickness"
            @input="onWallThicknessInput"
          />
        </label>
      </div>
    </div>
  </header>
</template>
