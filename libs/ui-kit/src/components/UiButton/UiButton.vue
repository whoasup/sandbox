<script setup lang="ts">
import { computed } from 'vue';
import type { UiSize } from '../../types';
import type { UiButtonVariant } from './types';

const props = withDefaults(
  defineProps<{
    variant?: UiButtonVariant;
    size?: UiSize;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
  }
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const isInteractive = computed(() => !props.disabled && !props.loading);

function onClick(event: MouseEvent) {
  if (!isInteractive.value) {
    event.preventDefault();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--${size}`,
      { 'ui-button--block': block, 'ui-button--loading': loading },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <span v-if="$slots.leading" class="ui-button__affix"><slot name="leading" /></span>
    <span class="ui-button__label"><slot /></span>
    <span v-if="$slots.trailing" class="ui-button__affix"><slot name="trailing" /></span>
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  border: var(--ui-border-width) solid transparent;
  border-radius: var(--ui-radius-md);
  font-family: var(--ui-font-family-base);
  font-weight: var(--ui-font-weight-medium);
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition:
    background-color var(--ui-duration-fast) var(--ui-easing-standard),
    border-color var(--ui-duration-fast) var(--ui-easing-standard),
    color var(--ui-duration-fast) var(--ui-easing-standard),
    box-shadow var(--ui-duration-fast) var(--ui-easing-standard);
}

.ui-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--ui-focus-ring-width) var(--ui-color-focus-ring);
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* sizes */
.ui-button--sm {
  height: var(--ui-control-height-sm);
  padding-inline: var(--ui-space-3);
  font-size: var(--ui-font-size-sm);
}

.ui-button--md {
  height: var(--ui-control-height-md);
  padding-inline: var(--ui-space-4);
  font-size: var(--ui-font-size-md);
}

.ui-button--lg {
  height: var(--ui-control-height-lg);
  padding-inline: var(--ui-space-5);
  font-size: var(--ui-font-size-lg);
}

.ui-button--block {
  display: flex;
  width: 100%;
}

/* variants */
.ui-button--primary {
  background-color: var(--ui-color-primary);
  color: var(--ui-color-on-primary);
}

.ui-button--primary:hover:not(:disabled) {
  background-color: var(--ui-color-primary-hover);
}

.ui-button--secondary {
  background-color: var(--ui-color-surface);
  border-color: var(--ui-color-border-strong);
  color: var(--ui-color-text);
}

.ui-button--secondary:hover:not(:disabled) {
  background-color: var(--ui-color-surface-muted);
}

.ui-button--ghost {
  background-color: transparent;
  color: var(--ui-color-primary);
}

.ui-button--ghost:hover:not(:disabled) {
  background-color: var(--ui-color-primary-soft);
}

.ui-button--danger {
  background-color: var(--ui-color-danger);
  color: var(--ui-color-on-danger);
}

.ui-button--danger:hover:not(:disabled) {
  background-color: var(--ui-color-danger-hover);
}

.ui-button__affix {
  display: inline-flex;
  align-items: center;
}

.ui-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--ui-radius-full);
  animation: ui-button-spin 0.6s linear infinite;
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
