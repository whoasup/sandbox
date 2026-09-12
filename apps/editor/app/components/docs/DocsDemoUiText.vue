<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="docs-demo-ui-text">
    <UiText size="lg" weight="bold" as="p">Заголовок lg / bold</UiText>
    <UiText size="md" as="p">Основной текст md</UiText>
    <UiText size="sm" tone="muted" as="p">Приглушённый sm / muted</UiText>
  </div>
</template>
