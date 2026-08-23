<script setup lang="ts">
import { onMounted } from 'vue';
import { UiButton, UiText, useTheme } from '@sandbox/ui-kit';

const { theme, toggleTheme, initTheme } = useTheme();

// Reading localStorage / matchMedia has to wait for the client.
onMounted(() => initTheme());

useHead({
  title: 'Nuxt + TresJS sandbox',
  htmlAttrs: { lang: 'en', 'data-theme': 'light' },
});
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-container app-header__inner">
        <NuxtLink to="/" class="app-header__brand">
          <span class="app-header__mark" aria-hidden="true" />
          <UiText as="span" weight="semibold">sandbox</UiText>
        </NuxtLink>

        <nav class="app-header__nav">
          <NuxtLink to="/" class="app-header__link">Overview</NuxtLink>
          <NuxtLink to="/playground" class="app-header__link">Playground</NuxtLink>
        </nav>

        <UiButton variant="ghost" size="sm" @click="toggleTheme">
          {{ theme === 'dark' ? 'Light theme' : 'Dark theme' }}
        </UiButton>
      </div>
    </header>

    <main class="app-main">
      <NuxtPage />
    </main>

    <footer class="app-footer">
      <div class="app-container">
        <UiText variant="caption" tone="muted">
          Nx monorepo &middot; @sandbox/ui-kit &middot; Nuxt 4 &middot; TresJS
        </UiText>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--ui-z-dropdown);
  background-color: color-mix(in srgb, var(--ui-color-bg) 85%, transparent);
  border-bottom: var(--ui-border-width) solid var(--ui-color-border);
  backdrop-filter: blur(8px);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: var(--ui-space-5);
  height: 64px;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2);
  text-decoration: none;
  color: var(--ui-color-text);
}

.app-header__mark {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, var(--ui-color-primary), var(--ui-palette-brand-300));
  border-radius: var(--ui-radius-sm);
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: var(--ui-space-4);
  margin-inline-end: auto;
}

.app-header__link {
  color: var(--ui-color-text-muted);
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-medium);
  text-decoration: none;
  transition: color var(--ui-duration-fast) var(--ui-easing-standard);
}

.app-header__link:hover,
.app-header__link.router-link-active {
  color: var(--ui-color-text);
}

.app-main {
  flex: 1;
}

.app-footer {
  padding-block: var(--ui-space-5);
  border-top: var(--ui-border-width) solid var(--ui-color-border);
}
</style>
