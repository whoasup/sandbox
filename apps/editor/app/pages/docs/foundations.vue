<script setup lang="ts">
import {
  SHAPE_CATALOG,
  TEXTURE_LIST,
  UiShapeIcon,
  UiText,
  UiTextureSwatch,
  palette,
  radius,
  tokens,
} from '@sandbox/ui-kit';
import DocsNav from '../../components/docs/DocsNav.vue';

const colorEntries = Object.entries(palette);
const radiusEntries = Object.entries(radius);
const semanticColors = Object.entries(tokens.color);
</script>

<template>
  <div
    class="mx-auto flex h-full max-w-4xl flex-col gap-8 overflow-y-auto p-4 sm:p-6 lg:p-8"
    data-testid="docs-foundations-page"
  >
    <DocsNav />

    <div>
      <UiText size="lg" weight="bold" as="h1">Foundations</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Источник правды: `libs/ui-kit` (`palette` / `tokens` + `SHAPE_CATALOG` / `TEXTURE_LIST`).
      </UiText>
    </div>

    <section class="flex flex-col gap-3">
      <UiText weight="bold" as="h2">Palette</UiText>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
        <div v-for="[name, value] in colorEntries" :key="name" class="flex flex-col gap-1">
          <div class="h-12 rounded-md border border-border" :style="{ backgroundColor: value }" />
          <UiText size="xs" as="span">{{ name }}</UiText>
          <UiText size="xs" tone="muted" as="span" class="font-mono">{{ value }}</UiText>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <UiText weight="bold" as="h2">Semantic colors</UiText>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <div v-for="[name, value] in semanticColors" :key="name" class="flex flex-col gap-1">
          <div class="h-10 rounded-md border border-border" :style="{ backgroundColor: value }" />
          <UiText size="xs" as="span">{{ name }}</UiText>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <UiText weight="bold" as="h2">Radius</UiText>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="[name, value] in radiusEntries"
          :key="name"
          class="flex flex-col items-center gap-2"
        >
          <div
            class="h-14 w-14 border-2 border-primary bg-surface-raised"
            :style="{ borderRadius: value }"
          />
          <UiText size="xs" as="span">{{ name }} · {{ value }}</UiText>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <UiText weight="bold" as="h2">Shapes</UiText>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="shape in SHAPE_CATALOG"
          :key="shape.kind"
          class="flex flex-col items-center gap-1"
        >
          <UiShapeIcon :kind="shape.kind" :size="40" />
          <UiText size="xs" tone="muted" as="span">{{ shape.label }}</UiText>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <UiText weight="bold" as="h2">Textures</UiText>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="texture in TEXTURE_LIST"
          :key="texture.id"
          class="flex flex-col items-center gap-1"
        >
          <UiTextureSwatch :surface="texture.id" :size="48" :label="texture.label" />
          <UiText size="xs" tone="muted" as="span">{{ texture.label }}</UiText>
        </div>
      </div>
    </section>
  </div>
</template>
