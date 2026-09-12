<script setup lang="ts">
import { computed } from 'vue';
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

const props = withDefaults(
  defineProps<{
    /** Active project id from the route. */
    projectId?: string;
  }>(),
  { projectId: '' },
);

const {
  mode,
  tool,
  wallDefaults,
  activeSurface,
  activeColor,
  selection,
  addShape,
  removeSelected,
  applySurfaceToSelection,
  applyColorToSelection,
} = useEditorDocument();

const modeOptions = [
  { value: '2d' as const, label: '2D' },
  { value: '3d' as const, label: '3D' },
];

const toolOptions = [
  { value: 'select' as const, label: 'Выбор' },
  { value: 'wall' as const, label: 'Стена' },
];

const hasSelection = computed(() => selection.value !== null);
const showWallDefaults = computed(() => tool.value === 'wall' && mode.value === '2d');

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
</script>

<template>
  <header
    class="editor-toolbar flex flex-wrap items-center gap-6 border-b border-border bg-surface px-5 py-3 shadow-sm"
  >
    <div class="flex flex-col gap-1">
      <div class="mr-4 flex items-baseline gap-2">
        <UiText size="lg" weight="bold" as="h1">Планировщик</UiText>
        <UiText v-if="props.projectId" size="xs" tone="muted" as="span">{{
          props.projectId
        }}</UiText>
      </div>
      <slot name="status" />
      <div class="flex flex-wrap items-center gap-3">
        <UiToggleGroup v-model="mode" :options="modeOptions" />
        <UiToggleGroup v-model="tool" :options="toolOptions" />
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <UiText size="xs" tone="muted" as="span">Фигуры</UiText>
      <div class="flex items-center gap-2">
        <UiButton
          v-for="shape in SHAPE_CATALOG"
          :key="shape.kind"
          variant="secondary"
          size="md"
          :title="shape.label"
          @click="addShape(shape.kind)"
        >
          <template #icon>
            <UiShapeIcon :kind="shape.kind" :size="20" />
          </template>
          {{ shape.label }}
        </UiButton>
      </div>
    </div>

    <div v-if="showWallDefaults" class="flex flex-col gap-1">
      <UiText size="xs" tone="muted" as="span">Стена по умолчанию</UiText>
      <div class="flex items-center gap-3">
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

    <div class="flex flex-col gap-1">
      <UiText size="xs" tone="muted" as="span">Поверхность</UiText>
      <div class="flex items-center gap-2">
        <UiTextureSwatch
          v-for="texture in TEXTURE_LIST"
          :key="texture.id"
          :surface="texture.id"
          :size="34"
          :selected="activeSurface === texture.id"
          :label="texture.label"
          :title="texture.label"
          @click="applySurfaceToSelection(texture.id)"
        />
        <input
          class="h-[34px] w-[34px] cursor-pointer rounded-sm border border-border bg-none p-0"
          type="color"
          :value="activeColor"
          title="Цвет"
          @input="onColorInput"
        />
      </div>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <UiButton variant="ghost" :disabled="!hasSelection" @click="removeSelected">Удалить</UiButton>
    </div>
  </header>
</template>
