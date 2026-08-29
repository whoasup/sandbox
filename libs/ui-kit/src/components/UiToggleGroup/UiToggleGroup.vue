<script setup lang="ts" generic="TValue extends string">
import { classNames } from '../../helpers';
import type { ToggleOption } from './types';

const props = withDefaults(
  defineProps<{
    modelValue: TValue;
    options: readonly ToggleOption<TValue>[];
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);

const emit = defineEmits<{ 'update:modelValue': [TValue] }>();

function select(option: ToggleOption<TValue>): void {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
}

/**
 * The `ui-toggle-group*` BEM classes below are kept as stable
 * selectors for tests/CSS escape hatches (see `UiToggleGroup.spec.ts`) —
 * they carry no styling of their own now that Tailwind utilities do.
 */
const rootClasses = classNames(
  'ui-toggle-group',
  `ui-toggle-group--${props.size}`,
  'inline-flex gap-0.5 rounded-md bg-surface-sunken p-[3px]',
);

function itemClasses(option: ToggleOption<TValue>): string {
  const active = option.value === props.modelValue;
  return classNames(
    'ui-toggle-group__item',
    'cursor-pointer rounded-sm border-0 font-sans font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    props.size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs',
    // `bg-primary`/`bg-transparent` are mutually exclusive here (never both
    // applied to the same item) — combining the two would leave the winner
    // up to Tailwind's internal stylesheet order rather than this branch.
    {
      'ui-toggle-group__item--active bg-primary text-on-primary': active,
      'bg-transparent text-text-muted enabled:hover:bg-surface-raised enabled:hover:text-text':
        !active,
    },
  );
}
</script>

<template>
  <div :class="rootClasses" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :class="itemClasses(option)"
      :aria-selected="option.value === modelValue"
      :disabled="option.disabled"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
