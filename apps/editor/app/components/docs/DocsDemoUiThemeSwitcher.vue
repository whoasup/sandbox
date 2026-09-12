<script setup lang="ts">
import { UiText, UiThemeSwitcher } from '@sandbox/ui-kit';

const labels = { light: 'Светлая', dark: 'Тёмная', system: 'Системная' };
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="docs-demo-ui-theme-switcher">
    <UiThemeSwitcher size="sm" :labels="labels" />
    <UiText size="sm" tone="muted" as="p">
      Контекст темы уже предоставлен в `app.vue` — переключатель меняет `data-theme` у документа.
    </UiText>
  </div>
</template>
