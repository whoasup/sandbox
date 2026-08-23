<script setup lang="ts">
import { Vector3 } from 'three';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';

import type { ShapeKind } from '~/composables/useSceneSettings';

// Three.js vectors rather than array shorthand: the shorthand is valid at runtime
// but is not covered by the generated TresJS prop types.
const cameraPosition = new Vector3(3.2, 2.4, 4.2);
const keyLightPosition = new Vector3(4, 6, 4);
const fillLightPosition = new Vector3(-4, -2, -3);
const gridPosition = new Vector3(0, -1.8, 0);

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
        <TresPerspectiveCamera :position="cameraPosition" :look-at="[0, 0, 0]" />
        <OrbitControls :auto-rotate="autoRotate" :auto-rotate-speed="0.8" :enable-damping="true" />

        <TresAmbientLight :intensity="0.6" />
        <TresDirectionalLight :position="keyLightPosition" :intensity="1.8" />
        <TresPointLight :position="fillLightPosition" :intensity="12" color="#a5b4fc" />

        <SceneShape
          :shape="shape"
          :color="color"
          :speed="speed"
          :wireframe="wireframe"
        />

        <TresGridHelper :args="[12, 12, '#334155', '#1e293b']" :position="gridPosition" />
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
