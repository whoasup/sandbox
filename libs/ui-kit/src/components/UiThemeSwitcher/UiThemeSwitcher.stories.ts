import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent } from 'vue';
import { createThemeContext } from '../../composables/useTheme';
import UiThemeSwitcher from './UiThemeSwitcher.vue';

// `createThemeContext()` must run above `UiThemeSwitcher` in the tree (it
// `provide()`s the context the component `inject()`s) — this tiny wrapper
// stands in for the app root (`app.vue`) that does this for real.
const ThemeProviderDecorator = defineComponent({
  setup(_, { slots }) {
    createThemeContext();
    return () => slots.default?.();
  },
});

const meta: Meta<typeof UiThemeSwitcher> = {
  title: 'Components/UiThemeSwitcher',
  component: UiThemeSwitcher,
  tags: ['autodocs'],
  decorators: [
    () => ({
      components: { ThemeProviderDecorator },
      template: '<ThemeProviderDecorator><story /></ThemeProviderDecorator>',
    }),
  ],
};

export default meta;

type Story = StoryObj<typeof UiThemeSwitcher>;

export const Default: Story = {};

export const CustomLabels: Story = {
  args: {
    labels: { light: 'Светлая', dark: 'Тёмная', system: 'Системная' },
  },
};

export const Small: Story = {
  args: { size: 'sm' },
};
