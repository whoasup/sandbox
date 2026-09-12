<script setup lang="ts">
import { ref } from 'vue';
import { UiText, UiToggleGroup } from '@sandbox/ui-kit';

const mode = ref<'2d' | '3d'>('3d');
const options = [
  { value: '2d' as const, label: '2D' },
  { value: '3d' as const, label: '3D' },
];
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="docs-demo-ui-toggle-group">
    <UiToggleGroup v-model="mode" :options="options" />
    <UiText size="sm" tone="muted" as="p">Выбрано: {{ mode }}</UiText>
  </div>
</template>
