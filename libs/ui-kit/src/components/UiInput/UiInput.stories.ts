import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UiInput from './UiInput.vue';

const meta: Meta<typeof UiInput> = {
  title: 'Components/Input',
  component: UiInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Scene name',
    placeholder: 'rotating-cube',
    hint: 'Shown above the TresJS canvas.',
    size: 'md',
  },
  render: (args) => ({
    components: { UiInput },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template: `<div style="max-width: 320px"><UiInput v-bind="args" v-model="value" /></div>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => ({
    components: { UiInput },
    setup: () => ({ value: ref('') }),
    template: `
      <div style="display: grid; gap: 16px; max-width: 320px;">
        <UiInput size="sm" label="Small" placeholder="sm" />
        <UiInput size="md" label="Medium" placeholder="md" />
        <UiInput size="lg" label="Large" placeholder="lg" />
      </div>
    `,
  }),
};

export const Invalid: Story = {
  args: {
    label: 'Scene name',
    error: 'Scene name is already taken.',
    hint: undefined,
  },
};

export const Disabled: Story = {
  args: { disabled: true, hint: 'This field is locked.' },
};

export const WithAffixes: Story = {
  render: () => ({
    components: { UiInput },
    setup: () => ({ value: ref('') }),
    template: `
      <div style="max-width: 320px">
        <UiInput label="Search geometry" placeholder="torus knot">
          <template #leading>&#128269;</template>
          <template #trailing>&#8984;K</template>
        </UiInput>
      </div>
    `,
  }),
};
