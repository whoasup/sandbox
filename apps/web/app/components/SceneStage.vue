<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';

import type { ShapeKind } from '~/composables/useSceneSettings';

withDefaults(
  defineProps<{
    shape?: ShapeKind;
    color?: string;
    speed?: number;
    wireframe?: boolean;
    autoRotate?: boolean;
    height?: string;
  }>(),
  {
    shape: 'torusKnot',
    color: '#6366f1',
    speed: 0.6,
    wireframe: false,
    autoRotate: true,
    height: '420px',
  }
);
</script>

<template>
  <div class="scene-stage" :style="{ height }">
    <!-- WebGL only exists in the browser, so the canvas must not be server rendered. -->
    <ClientOnly>
      <TresCanvas clear-color="#0b1020" :alpha="false">
        <TresPerspectiveCamera :position="[3.2, 2.4, 4.2]" :look-at="[0, 0, 0]" />
        <OrbitControls :auto-rotate="autoRotate" :auto-rotate-speed="0.8" :enable-damping="true" />

        <TresAmbientLight :intensity="0.6" />
        <TresDirectionalLight :position="[4, 6, 4]" :intensity="1.8" />
        <TresPointLight :position="[-4, -2, -3]" :intensity="12" color="#a5b4fc" />

        <SceneShape
          :shape="shape"
          :color="color"
          :speed="speed"
          :wireframe="wireframe"
        />

        <TresGridHelper :args="[12, 12, '#334155', '#1e293b']" :position="[0, -1.8, 0]" />
      </TresCanvas>

      <template #fallback>
        <div class="scene-stage__fallback">Loading 3D scene&hellip;</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.scene-stage {
  position: relative;
  overflow: hidden;
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: var(--ui-radius-lg);
  background-color: #0b1020;
}

.scene-stage__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ui-palette-neutral-400);
  font-family: var(--ui-font-family-base);
  font-size: var(--ui-font-size-sm);
}
</style>
