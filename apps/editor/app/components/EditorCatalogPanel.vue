<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  FURNITURE_CATEGORIES,
  FURNITURE_CATEGORY_LABELS,
  UiButton,
  UiFurnitureIcon,
  UiText,
  filterFurnitureCatalog,
  type FurnitureCategory,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';

const { addFurniture } = useEditorDocument();

const category = ref<FurnitureCategory | 'all'>('all');
const query = ref('');

const filteredPresets = computed(() =>
  filterFurnitureCatalog({ category: category.value, query: query.value }),
);

const categoryOptions: { value: FurnitureCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...FURNITURE_CATEGORIES.map((id) => ({
    value: id,
    label: FURNITURE_CATEGORY_LABELS[id],
  })),
];

function onQueryInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value;
}
</script>

<template>
  <section
    class="flex flex-col gap-2 border-t border-border px-3 py-3"
    data-testid="editor-catalog-panel"
  >
    <UiText size="xs" tone="muted" as="span">Мебель</UiText>

    <input
      class="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
      type="search"
      placeholder="Поиск…"
      :value="query"
      data-testid="catalog-search"
      @input="onQueryInput"
    />

    <div class="flex flex-wrap gap-1" data-testid="catalog-categories">
      <UiButton
        v-for="option in categoryOptions"
        :key="option.value"
        size="sm"
        :variant="category === option.value ? 'primary' : 'secondary'"
        :pressed="category === option.value"
        @click="category = option.value"
      >
        {{ option.label }}
      </UiButton>
    </div>

    <div class="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
      <UiButton
        v-for="preset in filteredPresets"
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
      <UiText v-if="filteredPresets.length === 0" size="xs" tone="muted" as="p">
        Ничего не найдено
      </UiText>
    </div>
  </section>
</template>
