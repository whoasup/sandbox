<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';
import type { ExportService } from '../core/export/ExportService';
import type { PlanStyle } from '../core/export/PlanExportOptions';

const props = withDefaults(
  defineProps<{
    exportService: ExportService | null;
    projectId: string;
    floorId: string;
    planStyle?: PlanStyle;
    includeDimensions?: boolean;
    includeLegend?: boolean;
    disabled?: boolean;
  }>(),
  {
    planStyle: 'clean',
    includeDimensions: true,
    includeLegend: true,
    disabled: false,
  },
);

const emit = defineEmits<{
  exportJson: [];
  error: [message: string];
}>();

const open = ref(false);
const busy = ref(false);
const busyLabel = ref('');
const rootRef = ref<HTMLElement | null>(null);

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});

const canExport = computed(
  () => !props.disabled && !busy.value && props.exportService !== null && Boolean(props.floorId),
);

function planOpts() {
  return {
    projectId: props.projectId,
    floorId: props.floorId,
    style: props.planStyle,
    includeDimensions: props.includeDimensions,
    includeLegend: props.includeLegend,
  };
}

async function run(kind: 'png' | 'svg' | 'gltf' | '360'): Promise<void> {
  if (!props.exportService || !canExport.value) return;
  open.value = false;
  busy.value = true;
  busyLabel.value =
    kind === 'png'
      ? 'PNG…'
      : kind === 'svg'
        ? 'SVG…'
        : kind === 'gltf'
          ? 'glTF…'
          : kind === '360'
            ? '360…'
            : '';
  try {
    const floorOpts = { projectId: props.projectId, floorId: props.floorId };
    if (kind === 'png') await props.exportService.downloadPng(planOpts());
    else if (kind === 'svg') await props.exportService.downloadSvg(planOpts());
    else if (kind === '360') await props.exportService.download360(floorOpts);
    else await props.exportService.downloadGltf(floorOpts);
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
  <div ref="rootRef" class="relative" data-testid="editor-export-menu">
    <UiButton
      variant="secondary"
      size="sm"
      class="min-h-11 lg:min-h-0"
      :disabled="disabled && !busy"
      :title="busy ? `Экспорт ${busyLabel}` : 'Экспорт'"
      data-testid="export-menu-trigger"
      @click="toggle"
    >
      {{ busy ? '…' : 'Экспорт' }}
    </UiButton>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-md border border-border bg-surface py-1 shadow-md"
      role="menu"
      data-testid="export-menu-panel"
    >
      <button
        type="button"
        class="block min-h-11 w-full px-3 py-2.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-png"
        @click="run('png')"
      >
        PNG
      </button>
      <button
        type="button"
        class="block min-h-11 w-full px-3 py-2.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-svg"
        @click="run('svg')"
      >
        SVG
      </button>
      <button
        type="button"
        class="block min-h-11 w-full px-3 py-2.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-gltf"
        @click="run('gltf')"
      >
        glTF
      </button>
      <button
        type="button"
        class="block min-h-11 w-full px-3 py-2.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
        role="menuitem"
        :disabled="!canExport"
        data-testid="export-360"
        @click="run('360')"
      >
        360
      </button>
      <div class="my-1 border-t border-border" />
      <button
        type="button"
        class="block min-h-11 w-full px-3 py-2.5 text-left text-sm text-text hover:bg-surface-sunken disabled:opacity-50"
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
