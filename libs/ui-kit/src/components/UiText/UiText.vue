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

/**
 * Tailwind utility classes per variant. The `ui-text--*` BEM classes below
 * are kept alongside these purely as stable selectors for tests/CSS
 * escape hatches (see `UiText.spec.ts`) — they carry no styling of their
 * own now that Tailwind utilities own the actual visual rules.
 */
const SIZE_CLASSES: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
  xl: 'text-xl',
};

const WEIGHT_CLASSES: Record<TextWeight, string> = {
  regular: 'font-regular',
  medium: 'font-medium',
  bold: 'font-bold',
};

const TONE_CLASSES: Record<TextTone, string> = {
  default: 'text-text',
  muted: 'text-text-muted',
  danger: 'text-danger',
  success: 'text-success',
};

const classes = computed(() =>
  classNames(
    'ui-text',
    'font-sans leading-[1.4]',
    `ui-text--size-${props.size}`,
    SIZE_CLASSES[props.size],
    `ui-text--weight-${props.weight}`,
    WEIGHT_CLASSES[props.weight],
    `ui-text--tone-${props.tone}`,
    TONE_CLASSES[props.tone],
    { 'ui-text--truncate truncate': props.truncate },
  ),
);
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
