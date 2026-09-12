<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import type { ExportService } from '../core/export/ExportService';

const props = withDefaults(
  defineProps<{
    exportService: ExportService | null;
    projectId: string;
    floorId: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  exportJson: [];
  error: [message: string];
}>();

const open = ref(false);
const busy = ref(false);
const busyLabel = ref('');

const canExport = computed(
  () => !props.disabled && !busy.value && props.exportService !== null && Boolean(props.floorId),
);

async function run(kind: 'png' | 'svg' | 'gltf'): Promise<void> {
  if (!props.exportService || !canExport.value) return;
  open.value = false;
  busy.value = true;
  busyLabel.value =
    kind === 'png' ? 'PNG…' : kind === 'svg' ? 'SVG…' : kind === 'gltf' ? 'glTF…' : '';
  try {
    const opts = { projectId: props.projectId, floorId: props.floorId };
    if (kind === 'png') await props.exportService.downloadPng(opts);
    else if (kind === 'svg') await props.exportService.downloadSvg(opts);
    else await props.exportService.downloadGltf(opts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка экспорта';
    emit('error', message);
  } finally {
    busy.value = false;
    busyLabel.value = '';
  }
}

function onExportJson(): void {
  open.value = false;
  emit('exportJson');
}

function toggle(): void {
  if (props.disabled && !busy.value) return;
  open.value = !open.value;
}
</script>

<template>
  <div class="relative" data-testid="editor-export-menu">
    <UiButton
      variant="secondary"
      size="sm"
      :disabled="disabled && !busy"
      :title="busy ? `Экспорт ${busyLabel}` : 'Экспорт'"
      data-testid="export-menu-trigger"
      @click="toggle"
    >
      {{ busy ? `Экспорт ${busyLabel}` : 'Экспорт' }}
    </UiButton>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-md border border-border bg-surface py-1 shadow-md"
      role="menu"
      data-testid="export-menu-panel"
    >
      <button
        type="button"
        class="block w-full px-3 py-1.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-png"
        @click="run('png')"
      >
        PNG
      </button>
      <button
        type="button"
        class="block w-full px-3 py-1.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-svg"
        @click="run('svg')"
      >
        SVG
      </button>
      <button
        type="button"
        class="block w-full px-3 py-1.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-gltf"
        @click="run('gltf')"
      >
        glTF
      </button>
      <div class="my-1 border-t border-border" />
      <button
        type="button"
        class="block w-full px-3 py-1.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="disabled || busy"
        data-testid="export-json"
        @click="onExportJson"
      >
        Проект JSON…
      </button>
    </div>

    <UiText v-if="busy" size="xs" tone="muted" as="span" class="sr-only">
      Идёт экспорт {{ busyLabel }}
    </UiText>
  </div>
</template>
