<script setup lang="ts">
import { computed } from 'vue';
import {
  SHAPE_CATALOG,
  TEXTURE_LIST,
  UiButton,
  UiShapeIcon,
  UiText,
  UiTextureSwatch,
  UiThemeSwitcher,
  UiToggleGroup,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const {
  mode,
  activeSurface,
  activeColor,
  selectedId,
  addShape,
  removeSelected,
  applySurfaceToSelection,
  applyColorToSelection,
} = useEditorDocument();

const modeOptions = [
  { value: '2d' as const, label: '2D' },
  { value: '3d' as const, label: '3D' },
];

const hasSelection = computed(() => selectedId.value !== null);
const themeLabels = { light: 'Светлая', dark: 'Тёмная', system: 'Системная' };

function onColorInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  applyColorToSelection(value);
}
</script>

<template>
  <header
    class="editor-toolbar flex flex-wrap items-center gap-6 border-b border-border bg-surface px-5 py-3 shadow-sm"
  >
    <div class="flex flex-col gap-1">
      <UiText size="lg" weight="bold" as="h1" class="mr-4">Планировщик</UiText>
      <UiToggleGroup v-model="mode" :options="modeOptions" />
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
          title="Цвет фигуры"
          @input="onColorInput"
        />
      </div>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <UiThemeSwitcher size="sm" :labels="themeLabels" />
      <UiButton variant="ghost" :disabled="!hasSelection" @click="removeSelected">Удалить</UiButton>
    </div>
  </header>
</template>
