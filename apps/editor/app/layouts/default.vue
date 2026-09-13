<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import AppShellHeader from '../components/AppShellHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';

const route = useRoute();
const navOpen = ref(false);

const pageTitle = computed(() => {
  if (route.path.startsWith('/editor')) return 'Редактор';
  if (route.path.startsWith('/docs/storybook')) return 'Storybook';
  if (route.path.startsWith('/docs')) return 'Документация';
  return 'Проекты';
});

useHead({
  title: pageTitle,
});

function closeNav(): void {
  navOpen.value = false;
}

function toggleNav(): void {
  navOpen.value = !navOpen.value;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && navOpen.value) {
    closeNav();
  }
}

watch(
  () => route.fullPath,
  () => {
    closeNav();
  },
);

watch(navOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (open) {
    window.addEventListener('keydown', onKeydown);
  } else {
    window.removeEventListener('keydown', onKeydown);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <div class="flex h-screen bg-surface-sunken">
    <!-- Desktop rail -->
    <AppSidebar class="hidden lg:flex" />

    <!-- Mobile drawer overlay -->
    <div v-show="navOpen" class="fixed inset-0 z-40 flex lg:hidden" data-testid="app-nav-overlay">
      <AppSidebar drawer class="relative z-10" @navigate="closeNav" />
      <button
        type="button"
        class="min-w-0 flex-1 cursor-default border-0 bg-black/40"
        aria-label="Закрыть меню"
        data-testid="app-nav-backdrop"
        @click="closeNav"
      />
    </div>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="app-main">
      <AppShellHeader :expanded="navOpen" @toggle="toggleNav" />
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <slot />
      </div>
    </div>
  </div>
</template>
