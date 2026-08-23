import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UiText from './UiText.vue';

const meta: Meta<typeof UiText> = {
  title: 'Components/Text',
  component: UiText,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['display', 'heading', 'subheading', 'body', 'body-lg', 'caption', 'code'],
    },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'primary', 'success', 'warning', 'danger'],
    },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    weight: { control: 'select', options: ['regular', 'medium', 'semibold', 'bold'] },
    truncate: { control: 'boolean' },
  },
  args: {
    variant: 'body',
    tone: 'default',
    align: 'start',
    truncate: false,
  },
  render: (args) => ({
    components: { UiText },
    setup: () => ({ args }),
    template: `<UiText v-bind="args">The quick brown fox renders 60 frames per second.</UiText>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => ({
    components: { UiText },
    template: `
      <div style="display: grid; gap: 12px;">
        <UiText variant="display">Display</UiText>
        <UiText variant="heading">Heading</UiText>
        <UiText variant="subheading">Subheading</UiText>
        <UiText variant="body-lg">Body large — comfortable reading size for intros.</UiText>
        <UiText variant="body">Body — the default paragraph size.</UiText>
        <UiText variant="caption" tone="muted">Caption</UiText>
        <UiText variant="code">const scene = useTresContext()</UiText>
      </div>
    `,
  }),
};

export const Tones: Story = {
  render: () => ({
    components: { UiText },
    template: `
      <div style="display: grid; gap: 8px;">
        <UiText tone="default">Default tone</UiText>
        <UiText tone="muted">Muted tone</UiText>
        <UiText tone="primary">Primary tone</UiText>
        <UiText tone="success">Success tone</UiText>
        <UiText tone="warning">Warning tone</UiText>
        <UiText tone="danger">Danger tone</UiText>
      </div>
    `,
  }),
};

export const Truncated: Story = {
  args: { truncate: true },
  render: (args) => ({
    components: { UiText },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 240px; border: 1px dashed var(--ui-color-border-strong); padding: 8px;">
        <UiText v-bind="args">
          A very long single line of text that has to be cut off with an ellipsis character.
        </UiText>
      </div>
    `,
  }),
};
