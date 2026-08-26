import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiText from './UiText.vue';

const meta: Meta<typeof UiText> = {
  title: 'Components/UiText',
  component: UiText,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    weight: { control: 'select', options: ['regular', 'medium', 'bold'] },
    tone: { control: 'select', options: ['default', 'muted', 'danger', 'success'] },
    as: { control: 'select', options: ['p', 'span', 'h1', 'h2', 'h3', 'label'] },
  },
  args: { size: 'md', weight: 'regular', tone: 'default', as: 'p' },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { UiText },
    setup: () => ({ args }),
    template: '<UiText v-bind="args">Редактор помещений 2D/3D</UiText>',
  }),
};

export const Scale: Story = {
  render: () => ({
    components: { UiText },
    template: `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <UiText size="xl" weight="bold">Заголовок xl/bold</UiText>
        <UiText size="lg" weight="medium">Заголовок lg/medium</UiText>
        <UiText size="md">Основной текст md</UiText>
        <UiText size="sm" tone="muted">Вторичный текст sm/muted</UiText>
        <UiText size="xs" tone="danger">Ошибка xs/danger</UiText>
      </div>
    `,
  }),
};
