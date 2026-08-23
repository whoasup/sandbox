<script setup lang="ts">
import { computed } from 'vue';
import type { FontSizeToken } from '../../tokens';
import type { UiTextTone, UiTextVariant, UiTextWeight } from './types';

const variantTag: Record<UiTextVariant, string> = {
  display: 'h1',
  heading: 'h2',
  subheading: 'h3',
  body: 'p',
  'body-lg': 'p',
  caption: 'span',
  code: 'code',
};

const props = withDefaults(
  defineProps<{
    variant?: UiTextVariant;
    tone?: UiTextTone;
    as?: string;
    align?: 'start' | 'center' | 'end';
    weight?: UiTextWeight;
    size?: FontSizeToken;
    truncate?: boolean;
  }>(),
  {
    variant: 'body',
    tone: 'default',
    align: 'start',
    truncate: false,
  }
);

const tag = computed(() => props.as ?? variantTag[props.variant]);

const style = computed(() => ({
  ...(props.size ? { fontSize: `var(--ui-font-size-${props.size})` } : {}),
  ...(props.weight ? { fontWeight: `var(--ui-font-weight-${props.weight})` } : {}),
  textAlign: props.align,
}));
</script>

<template>
  <component
    :is="tag"
    class="ui-text"
    :class="[
      `ui-text--${variant}`,
      `ui-text--tone-${tone}`,
      { 'ui-text--truncate': truncate },
    ]"
    :style="style"
  >
    <slot />
  </component>
</template>

<style scoped>
.ui-text {
  margin: 0;
  font-family: var(--ui-font-family-base);
  color: var(--ui-color-text);
}

.ui-text--display {
  font-size: var(--ui-font-size-3xl);
  font-weight: var(--ui-font-weight-bold);
  line-height: var(--ui-line-height-tight);
  letter-spacing: -0.02em;
}

.ui-text--heading {
  font-size: var(--ui-font-size-2xl);
  font-weight: var(--ui-font-weight-semibold);
  line-height: var(--ui-line-height-tight);
  letter-spacing: -0.01em;
}

.ui-text--subheading {
  font-size: var(--ui-font-size-xl);
  font-weight: var(--ui-font-weight-semibold);
  line-height: var(--ui-line-height-tight);
}

.ui-text--body {
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-base);
}

.ui-text--body-lg {
  font-size: var(--ui-font-size-lg);
  line-height: var(--ui-line-height-relaxed);
}

.ui-text--caption {
  font-size: var(--ui-font-size-xs);
  line-height: var(--ui-line-height-base);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ui-text--code {
  padding: 0.1em 0.4em;
  background-color: var(--ui-color-surface-muted);
  border-radius: var(--ui-radius-sm);
  font-family: var(--ui-font-family-mono);
  font-size: var(--ui-font-size-sm);
}

.ui-text--tone-muted {
  color: var(--ui-color-text-muted);
}

.ui-text--tone-primary {
  color: var(--ui-color-primary);
}

.ui-text--tone-success {
  color: var(--ui-color-success);
}

.ui-text--tone-warning {
  color: var(--ui-color-warning);
}

.ui-text--tone-danger {
  color: var(--ui-color-danger);
}

.ui-text--truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
