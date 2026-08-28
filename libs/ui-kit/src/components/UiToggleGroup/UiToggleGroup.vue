<script setup lang="ts" generic="TValue extends string">
import { classNames } from '../../helpers';
import type { ToggleOption } from './types';

withDefaults(
  defineProps<{
    modelValue: TValue;
    options: readonly ToggleOption<TValue>[];
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' }
);

const emit = defineEmits<{ 'update:modelValue': [TValue] }>();

function select(option: ToggleOption<TValue>): void {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
}
</script>

<template>
  <div :class="classNames('ui-toggle-group', `ui-toggle-group--${size}`)" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :class="classNames('ui-toggle-group__item', { 'ui-toggle-group__item--active': option.value === modelValue })"
      :aria-selected="option.value === modelValue"
      :disabled="option.disabled"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-toggle-group {
  display: inline-flex;
  padding: 3px;
  background-color: var(--ui-color-surface-sunken);
  border-radius: var(--ui-radius-md);
  gap: 2px;
}

.ui-toggle-group__item {
  border: none;
  background: transparent;
  color: var(--ui-color-text-muted);
  font-family: var(--ui-font-family-base);
  font-weight: var(--ui-font-weight-medium);
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ui-toggle-group--md .ui-toggle-group__item {
  padding: var(--ui-space-2) var(--ui-space-4);
  font-size: var(--ui-font-size-sm);
}

.ui-toggle-group--sm .ui-toggle-group__item {
  padding: var(--ui-space-1) var(--ui-space-3);
  font-size: var(--ui-font-size-xs);
}

.ui-toggle-group__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-toggle-group__item:hover:not(:disabled, .ui-toggle-group__item--active) {
  color: var(--ui-color-text);
  background-color: var(--ui-color-surface-raised);
}

.ui-toggle-group__item--active {
  color: var(--ui-color-text-on-primary);
  background-color: var(--ui-color-primary);
}
</style>
