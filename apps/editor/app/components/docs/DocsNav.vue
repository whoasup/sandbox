<script setup lang="ts">
import { computed } from 'vue';
import { DOCS_NAV } from '../../constants/docsCatalog';

const route = useRoute();
const activePath = computed(() => route.path);

function isActive(to: string): boolean {
  if (to === '/docs') return activePath.value === '/docs';
  return activePath.value === to || activePath.value.startsWith(`${to}/`);
}
</script>

<template>
  <nav
    class="docs-nav flex flex-wrap gap-2 border-b border-border pb-4"
    aria-label="Навигация по документации"
    data-testid="docs-nav"
  >
    <NuxtLink
      v-for="item in DOCS_NAV"
      :key="item.to"
      :to="item.to"
      class="min-h-11 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors"
      :class="
        isActive(item.to)
          ? 'bg-primary text-text-on-primary hover:bg-primary-hover'
          : 'text-text-muted hover:bg-surface-raised hover:text-text'
      "
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
