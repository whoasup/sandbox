<script setup lang="ts">
import { computed } from 'vue';
import {
  getFurniturePreset,
  getShapeMeta,
  UiButton,
  UiFurnitureIcon,
  UiShapeIcon,
  UiText,
  type FurnitureCatalogId,
  type ShapeKind,
} from '@sandbox/ui-kit';
import { useEditorDocument } from '../composables/useEditorDocument';
import type { SelectionRef } from '@sandbox/editor-core';

const { objects, furniture, walls, selection, selectEntity } = useEditorDocument();

type EntitySelection = Exclude<SelectionRef, null>;

interface ObjectListEntry {
  key: string;
  selection: EntitySelection;
  label: string;
  kind: 'shape' | 'furniture' | 'wall';
  catalogId?: FurnitureCatalogId;
  shapeKind?: ShapeKind;
}

const entries = computed<ObjectListEntry[]>(() => {
  const shapeEntries: ObjectListEntry[] = objects.value.map((object) => ({
    key: `shape:${object.id}`,
    selection: { type: 'shape', id: object.id },
    label: getShapeMeta(object.kind).label,
    kind: 'shape',
    shapeKind: object.kind,
  }));

  const furnitureEntries: ObjectListEntry[] = furniture.value.map((item) => ({
    key: `furniture:${item.id}`,
    selection: { type: 'furniture', id: item.id },
    label: getFurniturePreset(item.catalogId).label,
    kind: 'furniture',
    catalogId: item.catalogId,
  }));

  const wallEntries: ObjectListEntry[] = walls.value.map((wall, index) => ({
    key: `wall:${wall.id}`,
    selection: { type: 'wall', id: wall.id },
    label: `Стена ${index + 1}`,
    kind: 'wall',
  }));

  return [...shapeEntries, ...furnitureEntries, ...wallEntries];
});

function isSelected(entry: ObjectListEntry): boolean {
  const sel = selection.value;
  return sel?.type === entry.selection.type && sel.id === entry.selection.id;
}

function onSelect(entry: ObjectListEntry): void {
  selectEntity(entry.selection);
}
</script>

<template>
  <section
    class="flex flex-col gap-2 border-t border-border px-3 py-3"
    data-testid="editor-objects-list"
  >
    <UiText size="xs" tone="muted" as="span">Объекты</UiText>

    <UiText v-if="entries.length === 0" size="xs" tone="muted" as="p">Нет объектов на этаже</UiText>

    <div v-else class="flex max-h-48 flex-col gap-1 overflow-y-auto">
      <UiButton
        v-for="entry in entries"
        :key="entry.key"
        size="sm"
        :variant="isSelected(entry) ? 'primary' : 'secondary'"
        :pressed="isSelected(entry)"
        class="justify-start"
        :data-testid="`objects-list-${entry.kind}-${entry.selection.id}`"
        @click="onSelect(entry)"
      >
        <template #icon>
          <UiShapeIcon
            v-if="entry.kind === 'shape' && entry.shapeKind"
            :kind="entry.shapeKind"
            :size="16"
          />
          <UiFurnitureIcon
            v-else-if="entry.kind === 'furniture' && entry.catalogId"
            :kind="entry.catalogId"
            :size="16"
          />
        </template>
        {{ entry.label }}
      </UiButton>
    </div>
  </section>
</template>
