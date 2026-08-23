import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UiText from '../components/UiText/UiText.vue';

const semanticColors = [
  'bg',
  'surface',
  'surface-raised',
  'surface-muted',
  'text',
  'text-muted',
  'border',
  'border-strong',
  'primary',
  'primary-hover',
  'primary-soft',
  'success',
  'warning',
  'danger',
];

const spaces = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
const radii = ['sm', 'md', 'lg', 'xl', 'full'];
const fontSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
const shadows = ['sm', 'md', 'lg'];

const meta: Meta = {
  title: 'Foundations/Design tokens',
  parameters: {
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => ({
    components: { UiText },
    setup: () => ({ semanticColors }),
    template: `
      <section style="display: grid; gap: 16px;">
        <UiText variant="heading">Semantic colors</UiText>
        <UiText tone="muted">
          Every value is redefined per theme. Switch the theme in the toolbar to compare.
        </UiText>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
          <div
            v-for="name in semanticColors"
            :key="name"
            style="border: 1px solid var(--ui-color-border); border-radius: var(--ui-radius-md); overflow: hidden;"
          >
            <div :style="{ height: '56px', backgroundColor: 'var(--ui-color-' + name + ')' }" />
            <div style="padding: 8px;">
              <UiText variant="code">--ui-color-{{ name }}</UiText>
            </div>
          </div>
        </div>
      </section>
    `,
  }),
};

export const Spacing: Story = {
  render: () => ({
    components: { UiText },
    setup: () => ({ spaces }),
    template: `
      <section style="display: grid; gap: 16px;">
        <UiText variant="heading">Spacing scale</UiText>
        <div style="display: grid; gap: 8px;">
          <div v-for="step in spaces" :key="step" style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 140px;"><UiText variant="code">--ui-space-{{ step }}</UiText></div>
            <div
              :style="{
                height: '16px',
                width: 'var(--ui-space-' + step + ')',
                backgroundColor: 'var(--ui-color-primary)',
                borderRadius: 'var(--ui-radius-sm)',
              }"
            />
          </div>
        </div>
      </section>
    `,
  }),
};

export const Radii: Story = {
  render: () => ({
    components: { UiText },
    setup: () => ({ radii }),
    template: `
      <section style="display: grid; gap: 16px;">
        <UiText variant="heading">Radii</UiText>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div v-for="name in radii" :key="name" style="display: grid; gap: 8px; justify-items: center;">
            <div
              :style="{
                width: '72px',
                height: '72px',
                backgroundColor: 'var(--ui-color-primary-soft)',
                border: '1px solid var(--ui-color-primary)',
                borderRadius: 'var(--ui-radius-' + name + ')',
              }"
            />
            <UiText variant="code">{{ name }}</UiText>
          </div>
        </div>
      </section>
    `,
  }),
};

export const Typography: Story = {
  render: () => ({
    components: { UiText },
    setup: () => ({ fontSizes }),
    template: `
      <section style="display: grid; gap: 16px;">
        <UiText variant="heading">Type scale</UiText>
        <div style="display: grid; gap: 12px;">
          <div v-for="name in fontSizes" :key="name" style="display: flex; align-items: baseline; gap: 16px;">
            <div style="width: 160px;"><UiText variant="code">--ui-font-size-{{ name }}</UiText></div>
            <span :style="{ fontSize: 'var(--ui-font-size-' + name + ')', color: 'var(--ui-color-text)' }">
              Sandbox
            </span>
          </div>
        </div>
      </section>
    `,
  }),
};

export const Elevation: Story = {
  render: () => ({
    components: { UiText },
    setup: () => ({ shadows }),
    template: `
      <section style="display: grid; gap: 16px;">
        <UiText variant="heading">Elevation</UiText>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; padding: 16px;">
          <div v-for="name in shadows" :key="name" style="display: grid; gap: 12px; justify-items: center;">
            <div
              :style="{
                width: '120px',
                height: '80px',
                backgroundColor: 'var(--ui-color-surface-raised)',
                borderRadius: 'var(--ui-radius-lg)',
                boxShadow: 'var(--ui-shadow-' + name + ')',
              }"
            />
            <UiText variant="code">shadow-{{ name }}</UiText>
          </div>
        </div>
      </section>
    `,
  }),
};
