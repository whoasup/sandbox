<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiText } from '@sandbox/ui-kit';

const clicks = ref(0);
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="docs-demo-ui-button">
    <div class="flex flex-wrap items-center gap-2">
      <UiButton variant="primary" @click="clicks++">Primary</UiButton>
      <UiButton variant="secondary">Secondary</UiButton>
      <UiButton variant="ghost">Ghost</UiButton>
      <UiButton variant="primary" disabled>Disabled</UiButton>
    </div>
    <UiText size="sm" tone="muted" as="p">Кликов по Primary: {{ clicks }}</UiText>
  </div>
</template>
