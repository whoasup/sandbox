<script setup lang="ts">
import { computed } from 'vue';
import { classNames } from '../../helpers';
import type { TextAs, TextSize, TextTone, TextWeight } from './types';

interface Props {
  as?: TextAs;
  size?: TextSize;
  weight?: TextWeight;
  tone?: TextTone;
  truncate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  size: 'md',
  weight: 'regular',
  tone: 'default',
  truncate: false,
});

const classes = computed(() =>
  classNames(
    'ui-text',
    `ui-text--size-${props.size}`,
    `ui-text--weight-${props.weight}`,
    `ui-text--tone-${props.tone}`,
    { 'ui-text--truncate': props.truncate },
  ),
);
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>

<style scoped>
.ui-text {
  margin: 0;
  font-family: var(--ui-font-family-base);
  line-height: 1.4;
}

.ui-text--truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ui-text--size-xs {
  font-size: var(--ui-font-size-xs);
}

.ui-text--size-sm {
  font-size: var(--ui-font-size-sm);
}

.ui-text--size-md {
  font-size: var(--ui-font-size-md);
}

.ui-text--size-lg {
  font-size: var(--ui-font-size-lg);
}

.ui-text--size-xl {
  font-size: var(--ui-font-size-xl);
}

.ui-text--weight-regular {
  font-weight: var(--ui-font-weight-regular);
}

.ui-text--weight-medium {
  font-weight: var(--ui-font-weight-medium);
}

.ui-text--weight-bold {
  font-weight: var(--ui-font-weight-bold);
}

.ui-text--tone-default {
  color: var(--ui-color-text);
}

.ui-text--tone-muted {
  color: var(--ui-color-text-muted);
}

.ui-text--tone-danger {
  color: var(--ui-color-danger);
}

.ui-text--tone-success {
  color: var(--ui-color-success);
}
</style>
