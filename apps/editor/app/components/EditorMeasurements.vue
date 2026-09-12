<script setup lang="ts">
import { computed } from 'vue';
import { UiText } from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const { selection, objects, walls, wallDraftLength } = useEditorDocument();

const label = computed(() => {
  if (wallDraftLength.value != null) {
    return `Стена · ${wallDraftLength.value.toFixed(2)} м`;
  }
  const sel = selection.value;
  if (!sel) return '';
  if (sel.type === 'wall') {
    const wall = walls.value.find((w) => w.id === sel.id);
    return wall ? `Длина · ${wall.length.toFixed(2)} м` : '';
  }
  if (sel.type === 'shape') {
    const shape = objects.value.find((o) => o.id === sel.id);
    if (!shape) return '';
    const fp = shape.footprint;
    return `Контур · ${fp.width.toFixed(2)} × ${fp.depth.toFixed(2)} м`;
  }
  return '';
});
</script>

<template>
  <div
    v-if="label"
    class="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-md bg-surface/90 px-3 py-1 shadow-sm"
    data-testid="editor-measurements"
  >
    <UiText size="xs" as="span">{{ label }}</UiText>
  </div>
</template>
