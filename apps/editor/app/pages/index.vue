<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
import { DRAFT_PROJECT_ID } from '../constants/projects';

const draftHref = `/editor/${DRAFT_PROJECT_ID}`;
</script>

<template>
  <div class="mx-auto flex h-full max-w-3xl flex-col gap-6 p-8" data-testid="projects-page">
    <div>
      <UiText size="lg" weight="bold" as="h1">Проекты</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Локальная библиотека появится в Epic 05. Пока доступен черновик в памяти сессии.
      </UiText>
    </div>

    <NuxtLink
      :to="draftHref"
      class="block rounded-lg border border-border bg-surface p-5 text-text no-underline shadow-sm transition-colors hover:border-primary hover:bg-surface-raised"
      data-testid="draft-project-card"
    >
      <UiText weight="bold" as="p">Черновик</UiText>
      <UiText size="sm" tone="muted" as="p" class="mt-1">
        Открыть редактор · id «{{ DRAFT_PROJECT_ID }}»
      </UiText>
    </NuxtLink>
  </div>
</template>
