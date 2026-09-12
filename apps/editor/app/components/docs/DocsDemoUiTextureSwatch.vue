<script setup lang="ts">
import { ref } from 'vue';
import { TEXTURE_LIST, UiText, UiTextureSwatch, type SurfaceKind } from '@sandbox/ui-kit';

const selected = ref<SurfaceKind>('wood');
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="docs-demo-ui-texture-swatch">
    <div class="flex flex-wrap gap-2">
      <UiTextureSwatch
        v-for="texture in TEXTURE_LIST"
        :key="texture.id"
        :surface="texture.id"
        :size="40"
        :selected="selected === texture.id"
        :label="texture.label"
        @click="selected = texture.id"
      />
    </div>
    <UiText size="sm" tone="muted" as="p">Выбрано: {{ selected }}</UiText>
  </div>
</template>
