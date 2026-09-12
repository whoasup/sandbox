<script setup lang="ts">
import { computed } from 'vue';
import type { FurnitureCatalogId } from '../../furniture';

interface Props {
  kind: FurnitureCatalogId;
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
    class="ui-furniture-icon inline-block text-inherit"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'chair'">
      <rect x="6" y="9" width="12" height="3" rx="0.5" />
      <path d="M7 12 V18 M17 12 V18" />
      <path d="M7 9 V5.5 H17 V9" />
    </template>

    <template v-else-if="kind === 'table'">
      <rect x="4" y="8" width="16" height="3" rx="0.5" />
      <path d="M6.5 11 V18 M17.5 11 V18" />
    </template>

    <template v-else-if="kind === 'bed'">
      <path d="M3 16 V10 H8 V7 H21 V16" />
      <path d="M3 16 H21" />
      <path d="M8 10 H21" />
    </template>

    <template v-else-if="kind === 'wardrobe'">
      <rect x="5" y="3.5" width="14" height="17" rx="0.5" />
      <path d="M12 3.5 V20.5" />
      <circle cx="10" cy="12" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.7" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>
