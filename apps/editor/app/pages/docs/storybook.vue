<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { UiText } from '@sandbox/ui-kit';
import DocsNav from '../../components/docs/DocsNav.vue';

const isDev = import.meta.dev;
const runtimeConfig = useRuntimeConfig();
const staticSrc = computed(() => {
  const base = runtimeConfig.app.baseURL.endsWith('/')
    ? runtimeConfig.app.baseURL
    : `${runtimeConfig.app.baseURL}/`;
  return `${base}docs-storybook/index.html`;
});
const devSrc = 'http://localhost:4400/';

const iframeSrc = computed(() => (isDev ? devSrc : staticSrc.value));
const staticAvailable = ref(!isDev);
const checked = ref(isDev);

onMounted(async () => {
  if (isDev) return;
  try {
    const response = await fetch(staticSrc.value, { method: 'HEAD' });
    staticAvailable.value = response.ok;
  } catch {
    staticAvailable.value = false;
  } finally {
    checked.value = true;
  }
});
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-hidden p-4 sm:p-6 lg:p-8"
    data-testid="docs-storybook-page"
  >
    <DocsNav />

    <div>
      <UiText size="lg" weight="bold" as="h1">Storybook</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Интерактивные controls, a11y и autodocs. В dev — iframe на
        <code class="font-mono text-xs">localhost:4400</code>
        (`pnpm storybook`). В prod — статика из
        <code class="font-mono text-xs">pnpm build:storybook</code>
        →
        <code class="font-mono text-xs">apps/editor/public/docs-storybook</code>.
      </UiText>
    </div>

    <div
      v-if="isDev"
      class="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <iframe
        title="Storybook"
        class="h-[70vh] w-full border-0"
        :src="iframeSrc"
        data-testid="docs-storybook-iframe"
      />
    </div>

    <template v-else>
      <div
        v-if="checked && staticAvailable"
        class="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface"
      >
        <iframe
          title="Storybook"
          class="h-[70vh] w-full border-0"
          :src="staticSrc"
          data-testid="docs-storybook-iframe"
        />
      </div>
      <div
        v-else-if="checked"
        class="rounded-lg border border-border bg-surface p-5"
        data-testid="docs-storybook-missing"
      >
        <UiText as="p">
          Статический Storybook ещё не собран. Выполните
          <code class="font-mono text-xs">pnpm build:storybook</code>
          и перезапустите preview/build редактора.
        </UiText>
      </div>
    </template>
  </div>
</template>
