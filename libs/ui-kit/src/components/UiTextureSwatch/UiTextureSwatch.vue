<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { classNames } from '../../helpers';
import { drawTexturePattern, getTextureDefinition } from '../../textures';
import type { SurfaceKind } from '../../textures';

interface Props {
  surface: SurfaceKind;
  size?: number;
  selected?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), { size: 32, selected: false });

const canvasRef = ref<HTMLCanvasElement | null>(null);

function paint(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawTexturePattern(ctx, getTextureDefinition(props.surface), props.size);
}

onMounted(paint);
watch(() => [props.surface, props.size], paint);
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="size"
    :height="size"
    :class="classNames('ui-texture-swatch', { 'ui-texture-swatch--selected': selected })"
    :aria-label="label ?? getTextureDefinition(surface).label"
    role="img"
  />
</template>

<style scoped>
.ui-texture-swatch {
  display: block;
  border-radius: var(--ui-radius-sm);
  border: 2px solid transparent;
  outline: 1px solid var(--ui-color-border);
  outline-offset: -1px;
  cursor: pointer;
}

.ui-texture-swatch--selected {
  border-color: var(--ui-color-primary);
}
</style>
