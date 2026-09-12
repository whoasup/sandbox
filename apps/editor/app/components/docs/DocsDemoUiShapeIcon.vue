<script setup lang="ts">
import { SHAPE_CATALOG, UiShapeIcon, UiText } from '@sandbox/ui-kit';
</script>

<template>
  <div class="flex flex-wrap gap-4" data-testid="docs-demo-ui-shape-icon">
    <div v-for="shape in SHAPE_CATALOG" :key="shape.kind" class="flex flex-col items-center gap-1">
      <UiShapeIcon :kind="shape.kind" :size="32" />
      <UiText size="xs" tone="muted" as="span">{{ shape.label }}</UiText>
    </div>
  </div>
</template>
