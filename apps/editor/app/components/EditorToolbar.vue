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
  <header class="editor-toolbar">
    <div class="editor-toolbar__group">
      <UiText size="lg" weight="bold" as="h1" class="editor-toolbar__title">Планировщик</UiText>
      <UiToggleGroup v-model="mode" :options="modeOptions" />
    </div>

    <div class="editor-toolbar__group">
      <UiText size="xs" tone="muted" as="span">Фигуры</UiText>
      <div class="editor-toolbar__shapes">
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

    <div class="editor-toolbar__group">
      <UiText size="xs" tone="muted" as="span">Поверхность</UiText>
      <div class="editor-toolbar__surfaces">
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
          class="editor-toolbar__color"
          type="color"
          :value="activeColor"
          title="Цвет фигуры"
          @input="onColorInput"
        />
      </div>
    </div>

    <div class="editor-toolbar__group editor-toolbar__group--end">
      <UiThemeSwitcher size="sm" :labels="themeLabels" />
      <UiButton variant="ghost" :disabled="!hasSelection" @click="removeSelected">Удалить</UiButton>
    </div>
  </header>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ui-space-6);
  padding: var(--ui-space-3) var(--ui-space-5);
  background-color: var(--ui-color-surface);
  border-bottom: 1px solid var(--ui-color-border);
  box-shadow: var(--ui-shadow-sm);
  flex-wrap: wrap;
}

.editor-toolbar__title {
  margin-right: var(--ui-space-4);
}

.editor-toolbar__group {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-1);
}

.editor-toolbar__group--end {
  margin-left: auto;
  flex-direction: row;
  align-items: center;
}

.editor-toolbar__shapes,
.editor-toolbar__surfaces {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
}

.editor-toolbar__color {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  background: none;
}
</style>
