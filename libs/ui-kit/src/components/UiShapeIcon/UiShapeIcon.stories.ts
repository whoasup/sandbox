import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { SHAPE_CATALOG } from '../../shapes';
import UiShapeIcon from './UiShapeIcon.vue';

const meta: Meta<typeof UiShapeIcon> = {
  title: 'Components/UiShapeIcon',
  component: UiShapeIcon,
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'select', options: SHAPE_CATALOG.map((shape) => shape.kind) },
  },
  args: { kind: 'cube', size: 32 },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllShapes: Story = {
  render: () => ({
    components: { UiShapeIcon },
    setup: () => ({ shapes: SHAPE_CATALOG }),
    template: `
      <div style="display:flex; gap:20px;">
        <div v-for="shape in shapes" :key="shape.kind" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <UiShapeIcon :kind="shape.kind" :size="40" />
          <span style="font-size:12px;">{{ shape.label }}</span>
        </div>
      </div>
    `,
  }),
};
