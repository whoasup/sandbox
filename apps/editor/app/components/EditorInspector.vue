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
  selectedId,
  activeSurface,
  activeColor,
  replaceSelectedKind,
  setSelectedRotation,
  setSelectedScale,
  applySurfaceToSelection,
  applyColorToSelection,
  duplicateSelected,
  removeSelected,
} = useEditorDocument();

const selected = computed(
  () => objects.value.find((object) => object.id === selectedId.value) ?? null,
);

const rotationDegrees = computed({
  get: () => Math.round(((selected.value?.rotationY ?? 0) * 180) / Math.PI),
  set: (degrees: number) => {
    setSelectedRotation((degrees * Math.PI) / 180);
  },
});

const scaleValue = computed({
  get: () => selected.value?.scale ?? 1,
  set: (value: number) => {
    setSelectedScale(clamp(value, 0.25, 4));
  },
});

function onRotationInput(event: Event): void {
  rotationDegrees.value = Number((event.target as HTMLInputElement).value);
}

function onScaleInput(event: Event): void {
  scaleValue.value = Number((event.target as HTMLInputElement).value);
}

function onColorInput(event: Event): void {
  applyColorToSelection((event.target as HTMLInputElement).value);
}
</script>

<template>
  <aside
    class="editor-inspector flex w-64 shrink-0 flex-col gap-4 border-l border-border bg-surface p-4"
    data-testid="editor-inspector"
  >
    <UiText weight="bold" as="h2">Инспектор</UiText>

    <template v-if="selected">
      <div class="flex flex-col gap-2">
        <UiText size="xs" tone="muted" as="span">Фигура</UiText>
        <div class="flex flex-wrap gap-1">
          <UiButton
            v-for="shape in SHAPE_CATALOG"
            :key="shape.kind"
            size="sm"
            :variant="selected.kind === shape.kind ? 'primary' : 'secondary'"
            :pressed="selected.kind === shape.kind"
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

    <UiText v-else size="sm" tone="muted" as="p">Выберите фигуру на сцене</UiText>
  </aside>
</template>
