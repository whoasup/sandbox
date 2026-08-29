import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/vue3-vite';

import '../src/styles/index.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Foundations', 'Components'],
      },
    },
  },
  decorators: [
    // `@storybook/addon-themes` previews a fixed `data-theme` value per
    // toolbar entry — it has no notion of the OS's live `system` preference,
    // so there's no meaningful third "system" entry to add here. Real
    // system-preference resolution is exercised by `UiThemeSwitcher`'s own
    // stories/tests (see `UiThemeSwitcher.stories.ts`), which mount the
    // actual `useTheme()` composable instead of this decorator.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
