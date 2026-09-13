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

    <template v-else-if="kind === 'sofa'">
      <rect x="3" y="10" width="18" height="6" rx="1" />
      <path d="M3 10 V8 H6 V10 M21 10 V8 H18 V10" />
      <path d="M5 16 V19 M19 16 V19" />
    </template>

    <template v-else-if="kind === 'nightstand'">
      <rect x="6" y="8" width="12" height="10" rx="0.5" />
      <path d="M6 12 H18" />
      <circle cx="12" cy="15" r="0.7" fill="currentColor" stroke="none" />
    </template>

    <template v-else-if="kind === 'dining-table'">
      <ellipse cx="12" cy="10" rx="9" ry="4" />
      <path d="M7 12 V18 M17 12 V18" />
    </template>

    <template v-else-if="kind === 'stove'">
      <rect x="5" y="6" width="14" height="12" rx="0.5" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <circle cx="9" cy="15" r="1.5" />
      <circle cx="15" cy="15" r="1.5" />
    </template>

    <template v-else-if="kind === 'sink'">
      <rect x="4" y="7" width="16" height="10" rx="1" />
      <ellipse cx="12" cy="12" rx="5" ry="3" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </template>

    <template v-else-if="kind === 'toilet'">
      <rect x="8" y="4" width="8" height="6" rx="1" />
      <ellipse cx="12" cy="15" rx="5" ry="4" />
    </template>

    <template v-else-if="kind === 'bathtub'">
      <path d="M4 10 H20 V16 H4 Z" />
      <path d="M4 10 Q12 6 20 10" />
      <path d="M6 16 V19 M18 16 V19" />
    </template>

    <template v-else-if="kind === 'floor-lamp'">
      <path d="M12 20 V10" />
      <path d="M8 20 H16" />
      <path d="M8 10 H16 L14 5 H10 Z" />
    </template>

    <template v-else-if="kind === 'plant'">
      <path d="M12 20 V12" />
      <path d="M12 14 Q8 10 7 6" />
      <path d="M12 13 Q16 9 17 5" />
      <path d="M12 15 Q10 11 9 8" />
      <rect x="9" y="18" width="6" height="3" rx="0.5" />
    </template>

    <template v-else-if="kind === 'rug'">
      <rect x="3" y="7" width="18" height="10" rx="1" />
      <path d="M6 10 H18 M6 14 H18" />
    </template>

    <template v-else-if="kind === 'tv'">
      <rect x="4" y="5" width="16" height="11" rx="0.5" />
      <path d="M10 16 V19 H14 V16" />
      <path d="M8 19 H16" />
    </template>

    <template v-else-if="kind === 'shelf'">
      <path d="M5 7 H19 M5 12 H19 M5 17 H19" />
      <path d="M5 7 V17 M19 7 V17" />
    </template>

    <template v-else>
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </template>
  </svg>
</template>
