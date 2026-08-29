<script setup lang="ts">
import { computed } from 'vue';
import { classNames } from '../../helpers';
import type { ButtonSize, ButtonVariant } from './types';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressed?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  pressed: false,
  disabled: false,
  iconOnly: false,
  type: 'button',
});

const emit = defineEmits<{ click: [MouseEvent] }>();

/**
 * Tailwind utility classes per variant/size. The `ui-button--*` BEM classes
 * are kept alongside these purely as stable selectors for tests/CSS escape
 * hatches (see `UiButton.spec.ts`) — they carry no styling of their own now
 * that Tailwind utilities own the actual visual rules.
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-on-primary bg-primary border-transparent enabled:hover:bg-primary-hover',
  secondary: 'text-text bg-surface-raised border-border enabled:hover:bg-surface-sunken',
  ghost: 'text-text bg-transparent border-transparent enabled:hover:bg-surface-sunken',
};

// A pressed toggle button (e.g. a segmented control) always reads as
// "active", regardless of its base `variant`.
const PRESSED_CLASSES = 'text-on-primary bg-primary border-primary';

const TEXT_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-md',
};

// Regular padding (asymmetric x/y) vs. icon-only padding (symmetric, no
// label to balance against) are mutually exclusive per size, so applying
// exactly one of the two below never produces a conflicting pair of
// utility classes for the same size.
const PADDING_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2 py-1',
  md: 'px-4 py-2',
  lg: 'px-5 py-3',
};

const ICON_ONLY_PADDING_CLASSES: Record<ButtonSize, string> = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
};

const classes = computed(() =>
  classNames(
    'ui-button',
    'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border font-sans font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    `ui-button--${props.variant}`,
    `ui-button--${props.size}`,
    props.pressed ? PRESSED_CLASSES : VARIANT_CLASSES[props.variant],
    TEXT_SIZE_CLASSES[props.size],
    props.iconOnly ? ICON_ONLY_PADDING_CLASSES[props.size] : PADDING_CLASSES[props.size],
    {
      'ui-button--pressed': props.pressed,
      'ui-button--icon-only': props.iconOnly,
    },
  ),
);

function handleClick(event: MouseEvent): void {
  if (props.disabled) return;
  emit('click', event);
}
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled"
    :aria-pressed="pressed"
    @click="handleClick"
  >
    <span v-if="$slots.icon" class="ui-button__icon inline-flex items-center justify-center">
      <slot name="icon" />
    </span>
    <span v-if="$slots.default" class="ui-button__label">
      <slot />
    </span>
  </button>
</template>
