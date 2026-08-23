<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiInput, UiModal, UiText } from '@sandbox/ui-kit';

const isAboutOpen = ref(false);
const sceneName = ref('rotating-torus-knot');

useHead({ title: 'Overview — Nuxt + TresJS sandbox' });

const buildingBlocks = [
  {
    title: '@sandbox/ui-kit',
    body: 'Vue 3 components and design tokens, documented in Storybook and published to the workspace.',
  },
  {
    title: '@sandbox/web',
    body: 'Nuxt 4 application that consumes the kit and renders TresJS scenes.',
  },
  {
    title: 'Nx',
    body: 'Task graph, caching and project boundaries across both packages.',
  },
];
</script>

<template>
  <div>
    <section class="app-section">
      <div class="app-container app-grid app-grid--split">
        <div class="hero">
          <UiText variant="caption" tone="primary">Nx monorepo sandbox</UiText>
          <UiText variant="display">Learn Nuxt and TresJS with your own design system</UiText>
          <UiText variant="body-lg" tone="muted">
            Every control on this page comes from
            <UiText as="span" variant="code">@sandbox/ui-kit</UiText>, and every pixel inside the
            canvas comes from TresJS. Change a token in the library and both update.
          </UiText>

          <div class="hero__actions">
            <UiButton size="lg" @click="navigateTo('/playground')">
              Open playground
              <template #trailing>&#8594;</template>
            </UiButton>
            <UiButton size="lg" variant="secondary" @click="isAboutOpen = true">
              What is inside?
            </UiButton>
          </div>
        </div>

        <SceneStage height="360px" shape="torusKnot" color="#818cf8" :speed="0.5" />
      </div>
    </section>

    <section class="app-section">
      <div class="app-container app-grid">
        <UiText variant="heading">Workspace layout</UiText>
        <div class="cards">
          <article v-for="block in buildingBlocks" :key="block.title" class="app-card">
            <UiText variant="subheading">{{ block.title }}</UiText>
            <UiText tone="muted">{{ block.body }}</UiText>
          </article>
        </div>
      </div>
    </section>

    <section class="app-section">
      <div class="app-container app-grid">
        <UiText variant="heading">Kit components in place</UiText>
        <div class="app-card app-grid">
          <UiInput
            v-model="sceneName"
            label="Scene name"
            hint="Same input component as the one documented in Storybook."
          />
          <div class="hero__actions">
            <UiButton variant="primary">Primary</UiButton>
            <UiButton variant="secondary">Secondary</UiButton>
            <UiButton variant="ghost">Ghost</UiButton>
            <UiButton variant="danger">Danger</UiButton>
            <UiButton loading>Loading</UiButton>
          </div>
        </div>
      </div>
    </section>

    <UiModal
      v-model="isAboutOpen"
      title="What is inside this sandbox?"
      description="Two Nx projects, one design system."
    >
      <ul class="modal-list">
        <li>
          <UiText as="span" variant="code">libs/ui-kit</UiText> — components, tokens and Storybook.
        </li>
        <li>
          <UiText as="span" variant="code">apps/web</UiText> — this Nuxt app with TresJS scenes.
        </li>
        <li>
          <UiText as="span" variant="code">nx run-many -t build</UiText> — builds everything with
          caching.
        </li>
      </ul>
      <template #footer>
        <UiButton variant="ghost" @click="isAboutOpen = false">Close</UiButton>
        <UiButton @click="isAboutOpen = false; navigateTo('/playground')">
          Go to playground
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  gap: var(--ui-space-4);
  align-content: start;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ui-space-3);
}

.cards {
  display: grid;
  gap: var(--ui-space-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.cards .app-card {
  display: grid;
  gap: var(--ui-space-2);
  align-content: start;
}

.modal-list {
  display: grid;
  gap: var(--ui-space-2);
  margin: 0;
  padding-inline-start: var(--ui-space-5);
  color: var(--ui-color-text-muted);
}
</style>
