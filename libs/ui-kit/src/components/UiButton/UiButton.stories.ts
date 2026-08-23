import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UiButton from './UiButton.vue';

const meta: Meta<typeof UiButton> = {
  title: 'Components/Button',
  component: UiButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    block: { control: 'boolean' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    block: false,
  },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: `<UiButton v-bind="args">Launch scene</UiButton>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <UiButton variant="primary">Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton variant="danger">Danger</UiButton>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <UiButton size="sm">Small</UiButton>
        <UiButton size="md">Medium</UiButton>
        <UiButton size="lg">Large</UiButton>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <UiButton>Default</UiButton>
        <UiButton disabled>Disabled</UiButton>
        <UiButton loading>Loading</UiButton>
        <UiButton variant="secondary" loading>Loading</UiButton>
      </div>
    `,
  }),
};

export const WithAffixes: Story = {
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <UiButton>
          <template #leading>&#9679;</template>
          Leading slot
        </UiButton>
        <UiButton variant="secondary">
          Trailing slot
          <template #trailing>&#8594;</template>
        </UiButton>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  args: { block: true },
};
