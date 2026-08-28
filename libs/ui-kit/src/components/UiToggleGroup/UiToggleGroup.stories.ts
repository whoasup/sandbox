import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import UiToggleGroup from './UiToggleGroup.vue';

// `UiToggleGroup` is a generic SFC (`generic="TValue extends string"`), which doesn't
// structurally match the non-generic component type Storybook's `Meta` expects here.
const meta: Meta = {
  title: 'Components/UiToggleGroup',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
  component: UiToggleGroup as any,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const EditorMode: Story = {
  render: () => ({
    components: { UiToggleGroup },
    setup: () => {
      const mode = ref<'2d' | '3d'>('3d');
      return {
        mode,
        options: [
          { value: '2d', label: '2D' },
          { value: '3d', label: '3D' },
        ],
      };
    },
    template: '<UiToggleGroup v-model="mode" :options="options" />',
  }),
};

export const ThreeOptions: Story = {
  render: () => ({
    components: { UiToggleGroup },
    setup: () => {
      const surface = ref<'wood' | 'fabric' | 'stone'>('wood');
      return {
        surface,
        options: [
          { value: 'wood', label: 'Дерево' },
          { value: 'fabric', label: 'Ткань' },
          { value: 'stone', label: 'Камень' },
        ],
      };
    },
    template: '<UiToggleGroup v-model="surface" :options="options" size="sm" />',
  }),
};

export const WithDisabledOption: Story = {
  render: () => ({
    components: { UiToggleGroup },
    setup: () => {
      const mode = ref<'2d' | '3d'>('2d');
      return {
        mode,
        options: [
          { value: '2d', label: '2D' },
          { value: '3d', label: '3D', disabled: true },
        ],
      };
    },
    template: '<UiToggleGroup v-model="mode" :options="options" />',
  }),
};
