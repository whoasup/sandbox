import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { TEXTURE_LIST } from '../../textures';
import UiTextureSwatch from './UiTextureSwatch.vue';

const meta: Meta<typeof UiTextureSwatch> = {
  title: 'Components/UiTextureSwatch',
  component: UiTextureSwatch,
  tags: ['autodocs'],
  argTypes: {
    surface: { control: 'select', options: TEXTURE_LIST.map((t) => t.id) },
  },
  args: { surface: 'wood', size: 48 },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllSurfaces: Story = {
  render: () => ({
    components: { UiTextureSwatch },
    setup: () => {
      const selected = ref('wood');
      return { selected, textures: TEXTURE_LIST };
    },
    template: `
      <div style="display:flex; gap:12px;">
        <div v-for="texture in textures" :key="texture.id" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <UiTextureSwatch
            :surface="texture.id"
            :size="56"
            :selected="selected === texture.id"
            @click="selected = texture.id"
          />
          <span style="font-size:12px;">{{ texture.label }}</span>
        </div>
      </div>
    `,
  }),
};
