<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
</script>

<template>
  <div class="mx-auto flex h-full max-w-3xl flex-col gap-4 p-8" data-testid="docs-page">
    <UiText size="lg" weight="bold" as="h1">Документация</UiText>
    <UiText size="sm" tone="muted" as="p">
      Хаб документации `@sandbox/ui-kit` появится в Epic 02. Сейчас компоненты и токены описаны в
      Storybook (`pnpm storybook`, порт 4400).
    </UiText>
  </div>
</template>
