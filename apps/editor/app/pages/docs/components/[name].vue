<script setup lang="ts">
import { computed } from 'vue';
import { UiText } from '@sandbox/ui-kit';
import DocsDemoUiButton from '../../../components/docs/DocsDemoUiButton.vue';
import DocsDemoUiShapeIcon from '../../../components/docs/DocsDemoUiShapeIcon.vue';
import DocsDemoUiText from '../../../components/docs/DocsDemoUiText.vue';
import DocsDemoUiTextureSwatch from '../../../components/docs/DocsDemoUiTextureSwatch.vue';
import DocsDemoUiThemeSwitcher from '../../../components/docs/DocsDemoUiThemeSwitcher.vue';
import DocsDemoUiToggleGroup from '../../../components/docs/DocsDemoUiToggleGroup.vue';
import DocsNav from '../../../components/docs/DocsNav.vue';
import DocsPropsTable from '../../../components/docs/DocsPropsTable.vue';
import { getDocsComponent } from '../../../constants/docsCatalog';

const route = useRoute();
const slug = computed(() => String(route.params.name ?? ''));
const meta = computed(() => getDocsComponent(slug.value));

const demoBySlug: Record<string, unknown> = {
  'ui-button': DocsDemoUiButton,
  'ui-text': DocsDemoUiText,
  'ui-toggle-group': DocsDemoUiToggleGroup,
  'ui-shape-icon': DocsDemoUiShapeIcon,
  'ui-texture-swatch': DocsDemoUiTextureSwatch,
  'ui-theme-switcher': DocsDemoUiThemeSwitcher,
};

const Demo = computed(() => demoBySlug[slug.value] ?? null);
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8"
    data-testid="docs-component-page"
  >
    <DocsNav />

    <template v-if="meta">
      <div>
        <UiText size="lg" weight="bold" as="h1">{{ meta.name }}</UiText>
        <UiText size="sm" tone="muted" as="p" class="mt-1">{{ meta.summary }}</UiText>
      </div>

      <section class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        <UiText weight="bold" as="h2">Live demo</UiText>
        <component :is="Demo" v-if="Demo" />
      </section>

      <section class="flex flex-col gap-3">
        <UiText weight="bold" as="h2">Props</UiText>
        <DocsPropsTable :rows="meta.props" />
      </section>
    </template>

    <template v-else>
      <UiText size="lg" weight="bold" as="h1">Компонент не найден</UiText>
      <NuxtLink to="/docs/components" class="text-primary no-underline hover:underline">
        ← К списку компонентов
      </NuxtLink>
    </template>
  </div>
</template>
