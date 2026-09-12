<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
import DocsNav from '../../components/docs/DocsNav.vue';
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8"
    data-testid="docs-page"
  >
    <DocsNav />

    <div class="flex flex-col gap-3">
      <UiText size="lg" weight="bold" as="h1">@sandbox/ui-kit</UiText>
      <UiText size="sm" tone="muted" as="p">
        Vue 3 design system редактора: кнопки, типографика, тогглы, иконки фигур, swatch текстур и
        переключатель темы. Токены — двухслойные (primitives → semantic), Tailwind CSS v4.
      </UiText>
    </div>

    <section class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5">
      <UiText weight="bold" as="h2">Импорт</UiText>
      <pre class="overflow-x-auto rounded-md bg-surface-sunken p-3 font-mono text-xs text-text">
import { UiButton, createThemeContext } from '@sandbox/ui-kit';
import '@sandbox/ui-kit/styles.css';</pre>
      <UiText size="sm" tone="muted" as="p">
        В этом monorepo Vite/Nuxt резолвят `@sandbox/source` на исходники кита с HMR.
      </UiText>
    </section>

    <section class="grid gap-3 sm:grid-cols-3">
      <NuxtLink
        to="/docs/foundations"
        class="rounded-lg border border-border bg-surface p-4 text-text no-underline hover:border-primary"
      >
        <UiText weight="bold" as="p">Foundations</UiText>
        <UiText size="sm" tone="muted" as="p" class="mt-1">Цвета, радиусы, фигуры, текстуры</UiText>
      </NuxtLink>
      <NuxtLink
        to="/docs/components"
        class="rounded-lg border border-border bg-surface p-4 text-text no-underline hover:border-primary"
      >
        <UiText weight="bold" as="p">Компоненты</UiText>
        <UiText size="sm" tone="muted" as="p" class="mt-1">Live-демо и таблицы пропсов</UiText>
      </NuxtLink>
      <NuxtLink
        to="/docs/storybook"
        class="rounded-lg border border-border bg-surface p-4 text-text no-underline hover:border-primary"
      >
        <UiText weight="bold" as="p">Storybook</UiText>
        <UiText size="sm" tone="muted" as="p" class="mt-1">Controls, a11y, autodocs</UiText>
      </NuxtLink>
    </section>
  </div>
</template>
