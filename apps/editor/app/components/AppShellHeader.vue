<script setup lang="ts">
import { UiButton, UiText } from '@sandbox/ui-kit';

defineProps<{
  expanded: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <header
    class="flex min-h-11 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2 lg:hidden"
    data-testid="app-shell-header"
  >
    <UiButton
      variant="ghost"
      size="md"
      class="min-h-11 min-w-11"
      data-testid="app-nav-menu"
      :aria-expanded="expanded"
      aria-controls="app-nav-drawer"
      :aria-label="expanded ? 'Закрыть меню' : 'Открыть меню'"
      @click="emit('toggle')"
    >
      {{ expanded ? '✕' : '☰' }}
    </UiButton>
    <div class="min-w-0">
      <UiText size="md" weight="bold" as="p">Sandbox</UiText>
      <UiText size="xs" tone="muted" as="p">Планировщик комнат</UiText>
    </div>
  </header>
</template>
