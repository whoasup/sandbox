import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiButton from './UiButton.vue';

const meta: Meta<typeof UiButton> = {
  title: 'Components/UiButton',
  component: UiButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    pressed: false,
    iconOnly: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: '<UiButton v-bind="args">Добавить фигуру</UiButton>',
  }),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: '<UiButton v-bind="args">Отмена</UiButton>',
  }),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: '<UiButton v-bind="args">Ghost</UiButton>',
  }),
};

export const Pressed: Story = {
  args: { variant: 'secondary', pressed: true },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: '<UiButton v-bind="args">3D режим</UiButton>',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: '<UiButton v-bind="args">Недоступно</UiButton>',
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display:flex; gap:12px; align-items:center;">
        <UiButton size="sm">Small</UiButton>
        <UiButton size="md">Medium</UiButton>
        <UiButton size="lg">Large</UiButton>
      </div>
    `,
  }),
};
