<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
import DocsNav from '../../../components/docs/DocsNav.vue';
import { DOCS_COMPONENTS } from '../../../constants/docsCatalog';
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8"
    data-testid="docs-components-page"
  >
    <DocsNav />

    <div>
      <UiText size="lg" weight="bold" as="h1">Компоненты</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Шесть публичных `Ui*` примитивов. Откройте карточку для live-демо и таблицы пропсов.
      </UiText>
    </div>

    <ul class="m-0 flex list-none flex-col gap-3 p-0">
      <li v-for="component in DOCS_COMPONENTS" :key="component.slug">
        <NuxtLink
          :to="`/docs/components/${component.slug}`"
          class="block rounded-lg border border-border bg-surface p-4 text-text no-underline hover:border-primary"
        >
          <UiText weight="bold" as="p">{{ component.name }}</UiText>
          <UiText size="sm" tone="muted" as="p" class="mt-1">{{ component.summary }}</UiText>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
