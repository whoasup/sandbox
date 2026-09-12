<script setup lang="ts">
import { UiText } from '@sandbox/ui-kit';
import type { DocsPropRow } from '../../constants/docsCatalog';

defineProps<{
  rows: readonly DocsPropRow[];
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
      <thead class="bg-surface-raised">
        <tr>
          <th class="border-b border-border px-3 py-2 font-semibold">Prop</th>
          <th class="border-b border-border px-3 py-2 font-semibold">Type</th>
          <th class="border-b border-border px-3 py-2 font-semibold">Default</th>
          <th class="border-b border-border px-3 py-2 font-semibold">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name" class="odd:bg-surface even:bg-surface-sunken">
          <td class="border-b border-border px-3 py-2 font-mono text-xs">{{ row.name }}</td>
          <td class="border-b border-border px-3 py-2 font-mono text-xs text-text-muted">
            {{ row.type }}
          </td>
          <td class="border-b border-border px-3 py-2 font-mono text-xs text-text-muted">
            {{ row.defaultValue ?? '—' }}
          </td>
          <td class="border-b border-border px-3 py-2">
            <UiText as="span" size="sm">{{ row.description }}</UiText>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
