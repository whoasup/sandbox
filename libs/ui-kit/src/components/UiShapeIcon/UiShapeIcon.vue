<script setup lang="ts">
import { computed } from 'vue';
import type { ShapeKind } from '../../shapes';

interface Props {
  kind: ShapeKind;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), { size: 24 });

const viewBox = '0 0 24 24';
const style = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }));
</script>

<template>
  <svg
    :viewBox="viewBox"
    :style="style"
    class="ui-shape-icon inline-block text-inherit"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'cube'">
      <path d="M12 3.5 20 7.5 20 16.5 12 20.5 4 16.5 4 7.5 Z" />
      <path d="M4 7.5 12 11.5 20 7.5" />
      <path d="M12 11.5 12 20.5" />
    </template>

    <template v-else-if="kind === 'sphere'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12 C 7 9.5, 17 9.5, 20.5 12" />
      <path d="M12 3.5 C 9.5 7, 9.5 17, 12 20.5" />
    </template>

    <template v-else-if="kind === 'cylinder'">
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6 L4.5 18 C4.5 19.66 7.96 21 12 21 C16.04 21 19.5 19.66 19.5 18 L19.5 6" />
      <path d="M4.5 6 C4.5 7.66 7.96 9 12 9 C16.04 9 19.5 7.66 19.5 6" />
    </template>

    <template v-else-if="kind === 'pyramid'">
      <path d="M12 3 20.5 19.5 3.5 19.5 Z" />
      <path d="M12 3 12 19.5" />
      <path d="M3.5 19.5 12 12.5 20.5 19.5" />
    </template>
  </svg>
</template>
