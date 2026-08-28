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

const classes = computed(() =>
  classNames('ui-button', `ui-button--${props.variant}`, `ui-button--${props.size}`, {
    'ui-button--pressed': props.pressed,
    'ui-button--icon-only': props.iconOnly,
  }),
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
    <span v-if="$slots.icon" class="ui-button__icon">
      <slot name="icon" />
    </span>
    <span v-if="$slots.default" class="ui-button__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  border: 1px solid transparent;
  border-radius: var(--ui-radius-md);
  font-family: var(--ui-font-family-base);
  font-weight: var(--ui-font-weight-medium);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;
}

.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-button--sm {
  padding: var(--ui-space-1) var(--ui-space-2);
  font-size: var(--ui-font-size-xs);
}

.ui-button--md {
  padding: var(--ui-space-2) var(--ui-space-4);
  font-size: var(--ui-font-size-sm);
}

.ui-button--lg {
  padding: var(--ui-space-3) var(--ui-space-5);
  font-size: var(--ui-font-size-md);
}

.ui-button--icon-only.ui-button--sm {
  padding: var(--ui-space-1);
}

.ui-button--icon-only.ui-button--md {
  padding: var(--ui-space-2);
}

.ui-button--icon-only.ui-button--lg {
  padding: var(--ui-space-3);
}

.ui-button--primary {
  color: var(--ui-color-text-on-primary);
  background-color: var(--ui-color-primary);
}

.ui-button--primary:hover:not(:disabled) {
  background-color: var(--ui-color-primary-hover);
}

.ui-button--secondary {
  color: var(--ui-color-text);
  background-color: var(--ui-color-surface-raised);
  border-color: var(--ui-color-border);
}

.ui-button--secondary:hover:not(:disabled) {
  background-color: var(--ui-color-surface-sunken);
}

.ui-button--ghost {
  color: var(--ui-color-text);
  background-color: transparent;
}

.ui-button--ghost:hover:not(:disabled) {
  background-color: var(--ui-color-surface-sunken);
}

.ui-button--pressed {
  color: var(--ui-color-text-on-primary);
  background-color: var(--ui-color-primary);
  border-color: var(--ui-color-primary);
}

.ui-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
