<script setup lang="ts">
import { computed } from 'vue';
import {
  TEXTURE_LIST,
  UiButton,
  UiText,
  UiTextureSwatch,
  UiToggleGroup,
  type SurfaceKind,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';
import type { BackgroundPreset } from '../core/model/SceneSettings';
import EditorCatalogPanel from './EditorCatalogPanel.vue';

const { settings, patchSettings } = useEditorDocument();

const backgroundModeOptions = [
  { value: 'preset' as const, label: 'Пресет' },
  { value: 'color' as const, label: 'Цвет' },
];

const presetOptions = [
  { value: 'studio' as const, label: 'Studio' },
  { value: 'day' as const, label: 'Day' },
  { value: 'night' as const, label: 'Night' },
];

const backgroundMode = computed({
  get: () => settings.value.background.mode,
  set: (mode: 'color' | 'preset') => patchSettings({ background: { mode } }),
});

const backgroundPreset = computed({
  get: () => settings.value.background.preset ?? 'studio',
  set: (preset: BackgroundPreset) => patchSettings({ background: { mode: 'preset', preset } }),
});

function onBgColorInput(event: Event): void {
  const color = (event.target as HTMLInputElement).value;
  patchSettings({ background: { mode: 'color', color } });
}

function onFloorColorInput(event: Event): void {
  patchSettings({ floor: { color: (event.target as HTMLInputElement).value } });
}

function onWidthInput(event: Event): void {
  patchSettings({ field: { width: Number((event.target as HTMLInputElement).value) } });
}

function onDepthInput(event: Event): void {
  patchSettings({ field: { depth: Number((event.target as HTMLInputElement).value) } });
}

function onStepInput(event: Event): void {
  patchSettings({ field: { gridStep: Number((event.target as HTMLInputElement).value) } });
}

function toggleGrid(): void {
  patchSettings({ field: { gridVisible: !settings.value.field.gridVisible } });
}

function toggleSnap(): void {
  patchSettings({ field: { snap: !settings.value.field.snap } });
}

function toggleAxes(): void {
  patchSettings({ field: { axesVisible: !settings.value.field.axesVisible } });
}

function setFloorSurface(surface: SurfaceKind): void {
  patchSettings({ floor: { surface } });
}
</script>

<template>
  <aside
    class="editor-scene-panel flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-4"
    data-testid="editor-scene-panel"
  >
    <UiText weight="bold" as="h2">Сцена / поле</UiText>

    <div class="flex flex-col gap-2">
      <UiText size="xs" tone="muted" as="span">Фон</UiText>
      <UiToggleGroup v-model="backgroundMode" :options="backgroundModeOptions" size="sm" />
      <UiToggleGroup
        v-if="backgroundMode === 'preset'"
        v-model="backgroundPreset"
        :options="presetOptions"
        size="sm"
      />
      <input
        v-else
        class="h-8 w-full cursor-pointer rounded-sm border border-border bg-none p-0"
        type="color"
        :value="settings.background.color"
        @input="onBgColorInput"
      />
    </div>

    <div class="flex flex-col gap-2">
      <UiText size="xs" tone="muted" as="span">Поле · ширина / глубина</UiText>
      <label class="flex flex-col gap-1 text-xs text-text-muted">
        Ширина {{ settings.field.width }}
        <input
          type="range"
          min="8"
          max="60"
          step="1"
          :value="settings.field.width"
          @input="onWidthInput"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-text-muted">
        Глубина {{ settings.field.depth }}
        <input
          type="range"
          min="8"
          max="60"
          step="1"
          :value="settings.field.depth"
          @input="onDepthInput"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-text-muted">
        Шаг сетки {{ settings.field.gridStep }}
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.5"
          :value="settings.field.gridStep"
          @input="onStepInput"
        />
      </label>
    </div>

    <div class="flex flex-col gap-2">
      <UiButton
        size="sm"
        :variant="settings.field.gridVisible ? 'primary' : 'secondary'"
        :pressed="settings.field.gridVisible"
        @click="toggleGrid"
      >
        Сетка
      </UiButton>
      <UiButton
        size="sm"
        :variant="settings.field.snap ? 'primary' : 'secondary'"
        :pressed="settings.field.snap"
        @click="toggleSnap"
      >
        Snap
      </UiButton>
      <UiButton
        size="sm"
        :variant="settings.field.axesVisible ? 'primary' : 'secondary'"
        :pressed="settings.field.axesVisible"
        @click="toggleAxes"
      >
        Оси
      </UiButton>
    </div>

    <div class="flex flex-col gap-2">
      <UiText size="xs" tone="muted" as="span">Пол (по умолчанию)</UiText>
      <div class="flex flex-wrap items-center gap-2">
        <UiTextureSwatch
          v-for="texture in TEXTURE_LIST"
          :key="texture.id"
          :surface="texture.id"
          :size="28"
          :selected="settings.floor.surface === texture.id"
          :label="texture.label"
          @click="setFloorSurface(texture.id)"
        />
        <input
          class="h-7 w-7 cursor-pointer rounded-sm border border-border bg-none p-0"
          type="color"
          :value="settings.floor.color"
          title="Цвет пола"
          @input="onFloorColorInput"
        />
      </div>
    </div>

    <EditorCatalogPanel />
  </aside>
</template>
