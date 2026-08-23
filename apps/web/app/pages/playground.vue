<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiInput, UiModal, UiText } from '@sandbox/ui-kit';

import { shapeKinds, useSceneSettings } from '~/composables/useSceneSettings';
import type { ShapeKind } from '~/composables/useSceneSettings';

const { settings, reset } = useSceneSettings();

const colorDraft = ref(settings.color);
const isInfoOpen = ref(false);

const hexPattern = /^#([\da-f]{3}|[\da-f]{6})$/i;
const colorError = computed(() =>
  hexPattern.test(colorDraft.value) ? undefined : 'Use a hex value like #6366f1.'
);

const shapeLabels: Record<ShapeKind, string> = {
  torusKnot: 'Torus knot',
  torus: 'Torus',
  box: 'Box',
  sphere: 'Sphere',
  icosahedron: 'Icosahedron',
};

function applyColor() {
  if (colorError.value) return;
  settings.color = colorDraft.value;
}

function resetAll() {
  reset();
  colorDraft.value = settings.color;
}

useHead({ title: 'Playground — Nuxt + TresJS sandbox' });
</script>

<template>
  <section class="app-section">
    <div class="app-container app-grid app-grid--split">
      <div class="app-grid">
        <div>
          <UiText variant="heading">Scene playground</UiText>
          <UiText tone="muted">
            Drag to orbit, scroll to zoom. The panel on the right is built entirely from ui-kit
            components.
          </UiText>
        </div>

        <SceneStage
          height="520px"
          :shape="settings.shape"
          :color="settings.color"
          :speed="settings.speed"
          :wireframe="settings.wireframe"
          :auto-rotate="settings.autoRotate"
        />
      </div>

      <aside class="app-card panel">
        <UiText variant="subheading">Controls</UiText>

        <div class="panel__group">
          <UiText variant="caption" tone="muted">Geometry</UiText>
          <div class="panel__row">
            <UiButton
              v-for="kind in shapeKinds"
              :key="kind"
              size="sm"
              :variant="settings.shape === kind ? 'primary' : 'secondary'"
              @click="settings.shape = kind"
            >
              {{ shapeLabels[kind] }}
            </UiButton>
          </div>
        </div>

        <div class="panel__group">
          <UiInput
            v-model="colorDraft"
            label="Material color"
            placeholder="#6366f1"
            :error="colorError"
            @keyup.enter="applyColor"
          >
            <template #leading>
              <span
                class="panel__swatch"
                :style="{ backgroundColor: colorError ? 'transparent' : colorDraft }"
              />
            </template>
          </UiInput>
          <UiButton size="sm" :disabled="Boolean(colorError)" block @click="applyColor">
            Apply color
          </UiButton>
        </div>

        <div class="panel__group">
          <UiText variant="caption" tone="muted">
            Spin speed &mdash; {{ settings.speed.toFixed(2) }}
          </UiText>
          <input
            v-model.number="settings.speed"
            class="panel__range"
            type="range"
            min="0"
            max="3"
            step="0.05"
            aria-label="Spin speed"
          />
        </div>

        <div class="panel__group">
          <UiText variant="caption" tone="muted">Toggles</UiText>
          <div class="panel__row">
            <UiButton
              size="sm"
              :variant="settings.wireframe ? 'primary' : 'secondary'"
              @click="settings.wireframe = !settings.wireframe"
            >
              Wireframe
            </UiButton>
            <UiButton
              size="sm"
              :variant="settings.autoRotate ? 'primary' : 'secondary'"
              @click="settings.autoRotate = !settings.autoRotate"
            >
              Auto orbit
            </UiButton>
          </div>
        </div>

        <div class="panel__row panel__row--end">
          <UiButton size="sm" variant="ghost" @click="isInfoOpen = true">Scene info</UiButton>
          <UiButton size="sm" variant="danger" @click="resetAll">Reset</UiButton>
        </div>
      </aside>
    </div>

    <UiModal v-model="isInfoOpen" title="Scene info" size="sm">
      <dl class="info">
        <dt><UiText as="span" tone="muted">Geometry</UiText></dt>
        <dd><UiText as="span" variant="code">{{ settings.shape }}</UiText></dd>
        <dt><UiText as="span" tone="muted">Color</UiText></dt>
        <dd><UiText as="span" variant="code">{{ settings.color }}</UiText></dd>
        <dt><UiText as="span" tone="muted">Speed</UiText></dt>
        <dd><UiText as="span" variant="code">{{ settings.speed }}</UiText></dd>
        <dt><UiText as="span" tone="muted">Wireframe</UiText></dt>
        <dd><UiText as="span" variant="code">{{ settings.wireframe }}</UiText></dd>
      </dl>
      <template #footer>
        <UiButton variant="ghost" @click="isInfoOpen = false">Close</UiButton>
      </template>
    </UiModal>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--ui-space-5);
  align-content: start;
  position: sticky;
  top: 88px;
}

.panel__group {
  display: grid;
  gap: var(--ui-space-2);
}

.panel__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ui-space-2);
}

.panel__row--end {
  justify-content: flex-end;
}

.panel__swatch {
  width: 14px;
  height: 14px;
  border: var(--ui-border-width) solid var(--ui-color-border-strong);
  border-radius: var(--ui-radius-sm);
}

.panel__range {
  width: 100%;
  accent-color: var(--ui-color-primary);
}

.info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--ui-space-2) var(--ui-space-4);
  margin: 0;
}

.info dd {
  margin: 0;
}
</style>
