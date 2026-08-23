<script setup lang="ts">
import { shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import type { Mesh } from 'three';

import type { ShapeKind } from '~/composables/useSceneSettings';

const props = withDefaults(
  defineProps<{
    shape?: ShapeKind;
    color?: string;
    speed?: number;
    wireframe?: boolean;
    metalness?: number;
    roughness?: number;
  }>(),
  {
    shape: 'torusKnot',
    color: '#6366f1',
    speed: 0.6,
    wireframe: false,
    metalness: 0.35,
    roughness: 0.25,
  }
);

const meshRef = shallowRef<Mesh | null>(null);

// `useLoop` needs the Tres context, which is why this component has to live
// inside <TresCanvas> rather than animate the mesh from the page.
const { onBeforeRender } = useLoop();

onBeforeRender(({ delta }) => {
  if (!meshRef.value) return;
  meshRef.value.rotation.x += delta * props.speed;
  meshRef.value.rotation.y += delta * props.speed * 0.6;
});
</script>

<template>
  <TresMesh ref="meshRef" :cast-shadow="true">
    <TresBoxGeometry v-if="shape === 'box'" :args="[1.6, 1.6, 1.6]" />
    <TresSphereGeometry v-else-if="shape === 'sphere'" :args="[1.1, 48, 48]" />
    <TresTorusGeometry v-else-if="shape === 'torus'" :args="[1, 0.36, 24, 96]" />
    <TresIcosahedronGeometry v-else-if="shape === 'icosahedron'" :args="[1.3, 0]" />
    <TresTorusKnotGeometry v-else :args="[0.9, 0.3, 160, 32]" />

    <TresMeshStandardMaterial
      :color="color"
      :wireframe="wireframe"
      :metalness="metalness"
      :roughness="roughness"
    />
  </TresMesh>
</template>
