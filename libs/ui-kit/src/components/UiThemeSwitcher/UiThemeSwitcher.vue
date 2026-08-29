<script setup lang="ts">
import { computed } from 'vue';
import { useTheme, type ThemePreference } from '../../composables/useTheme';
import UiToggleGroup from '../UiToggleGroup/UiToggleGroup.vue';
import type { ThemeSwitcherLabels } from './types';

interface Props {
  labels?: ThemeSwitcherLabels;
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  labels: () => ({ light: 'Light', dark: 'Dark', system: 'System' }),
  size: 'md',
});

const { preference, setTheme } = useTheme();

const options = computed(() => [
  { value: 'light' as const, label: props.labels.light },
  { value: 'dark' as const, label: props.labels.dark },
  { value: 'system' as const, label: props.labels.system },
]);

function onUpdate(value: ThemePreference): void {
  setTheme(value);
}
</script>

<template>
  <UiToggleGroup
    class="ui-theme-switcher"
    :model-value="preference"
    :options="options"
    :size="size"
    @update:model-value="onUpdate"
  />
</template>
