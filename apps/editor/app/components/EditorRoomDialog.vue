<script setup lang="ts">
import { ref, watch } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { wallDefaults, setPendingRoomPlacement } = useEditorDocument();

const width = ref(4);
const depth = ref(5);
const name = ref('Комната');
const wallHeight = ref(wallDefaults.height);

const presets = [
  { id: '3x4', label: '3×4', width: 3, depth: 4 },
  { id: '4x5', label: '4×5', width: 4, depth: 5 },
  { id: 'studio', label: 'Студия 6×4', width: 6, depth: 4 },
] as const;

watch(
  () => props.open,
  (open) => {
    if (open) {
      wallHeight.value = wallDefaults.height;
    }
  },
);

function applyPreset(preset: (typeof presets)[number]): void {
  width.value = preset.width;
  depth.value = preset.depth;
  if (preset.id === 'studio') name.value = 'Студия';
}

function onCancel(): void {
  emit('close');
}

function onPlace(): void {
  const w = Math.max(0.5, Number(width.value) || 0.5);
  const d = Math.max(0.5, Number(depth.value) || 0.5);
  const h = Math.max(0.5, Number(wallHeight.value) || wallDefaults.height);
  setPendingRoomPlacement({
    width: w,
    depth: d,
    name: name.value.trim() || 'Комната',
    wallHeight: h,
  });
  wallDefaults.height = h;
  emit('close');
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    data-testid="editor-room-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="editor-room-dialog-title"
    @click.self="onCancel"
  >
    <div
      class="w-full max-w-md rounded-t-xl border border-border bg-surface p-4 shadow-lg sm:rounded-xl sm:p-5"
    >
      <UiText id="editor-room-dialog-title" weight="bold" as="h2">Новая комната</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Задайте размеры, затем кликните на плане, чтобы разместить комнату.
      </UiText>

      <div class="mt-4 flex flex-wrap gap-2">
        <UiButton
          v-for="preset in presets"
          :key="preset.id"
          size="sm"
          variant="secondary"
          :data-testid="`room-preset-${preset.id}`"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </UiButton>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-xs text-text-muted">
          Ширина, м
          <input
            v-model.number="width"
            class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
            type="number"
            min="0.5"
            step="0.1"
            data-testid="room-dialog-width"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs text-text-muted">
          Глубина, м
          <input
            v-model.number="depth"
            class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
            type="number"
            min="0.5"
            step="0.1"
            data-testid="room-dialog-depth"
          />
        </label>
        <label class="col-span-2 flex flex-col gap-1 text-xs text-text-muted">
          Название
          <input
            v-model="name"
            class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
            type="text"
            data-testid="room-dialog-name"
          />
        </label>
        <label class="col-span-2 flex flex-col gap-1 text-xs text-text-muted">
          Высота стен, м
          <input
            v-model.number="wallHeight"
            class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
            type="number"
            min="0.5"
            step="0.1"
            data-testid="room-dialog-wall-height"
          />
        </label>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <UiButton variant="ghost" size="sm" data-testid="room-dialog-cancel" @click="onCancel">
          Отмена
        </UiButton>
        <UiButton variant="primary" size="sm" data-testid="room-dialog-place" @click="onPlace">
          Разместить
        </UiButton>
      </div>
    </div>
  </div>
</template>
