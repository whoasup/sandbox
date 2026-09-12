<script setup lang="ts">
import { FURNITURE_CATALOG, UiButton, UiFurnitureIcon, UiText } from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const { addFurniture } = useEditorDocument();
</script>

<template>
  <section
    class="flex flex-col gap-2 border-t border-border px-3 py-3"
    data-testid="editor-catalog-panel"
  >
    <UiText size="xs" tone="muted" as="span">Мебель</UiText>
    <div class="grid grid-cols-2 gap-2">
      <UiButton
        v-for="preset in FURNITURE_CATALOG"
        :key="preset.id"
        variant="secondary"
        size="sm"
        :title="preset.label"
        :data-testid="`furniture-${preset.id}`"
        @click="addFurniture(preset.id)"
      >
        <template #icon>
          <UiFurnitureIcon :kind="preset.id" :size="18" />
        </template>
        {{ preset.label }}
      </UiButton>
    </div>
  </section>
</template>
