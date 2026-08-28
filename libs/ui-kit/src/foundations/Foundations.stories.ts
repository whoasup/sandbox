import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { SHAPE_CATALOG } from '../shapes';
import { TEXTURE_LIST } from '../textures';
import UiShapeIcon from '../components/UiShapeIcon/UiShapeIcon.vue';
import UiText from '../components/UiText/UiText.vue';
import UiTextureSwatch from '../components/UiTextureSwatch/UiTextureSwatch.vue';

const meta: Meta = {
  title: 'Foundations/Design tokens',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const colorTokens = [
  '--ui-color-surface',
  '--ui-color-surface-raised',
  '--ui-color-surface-sunken',
  '--ui-color-primary',
  '--ui-color-text',
  '--ui-color-text-muted',
  '--ui-color-danger',
  '--ui-color-success',
];

export const Colors: Story = {
  render: () => ({
    setup: () => ({ colorTokens }),
    template: `
      <div style="display:flex; flex-wrap:wrap; gap:16px;">
        <div v-for="token in colorTokens" :key="token" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <div :style="{ width: '64px', height: '64px', borderRadius: '8px', border: '1px solid var(--ui-color-border)', background: 'var(' + token + ')' }" />
          <code style="font-size:11px;">{{ token }}</code>
        </div>
      </div>
    `,
  }),
};

export const Shapes: Story = {
  render: () => ({
    components: { UiShapeIcon, UiText },
    setup: () => ({ shapes: SHAPE_CATALOG }),
    template: `
      <div style="display:flex; gap:24px;">
        <div v-for="shape in shapes" :key="shape.kind" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <UiShapeIcon :kind="shape.kind" :size="48" />
          <UiText size="sm">{{ shape.label }}</UiText>
        </div>
      </div>
    `,
  }),
};

export const Textures: Story = {
  render: () => ({
    components: { UiTextureSwatch, UiText },
    setup: () => ({ textures: TEXTURE_LIST }),
    template: `
      <div style="display:flex; gap:24px;">
        <div v-for="texture in textures" :key="texture.id" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <UiTextureSwatch :surface="texture.id" :size="64" />
          <UiText size="sm">{{ texture.label }}</UiText>
        </div>
      </div>
    `,
  }),
};
