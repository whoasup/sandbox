import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createThemeContext } from '../../composables/useTheme';
import UiThemeSwitcher from './UiThemeSwitcher.vue';
import type { ThemeSwitcherLabels } from './types';

function stubMatchMedia(prefersDark: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// A single wrapper stands in for the app root (`app.vue`), which is where
// `createThemeContext()` is called for real — it `provide()`s the context
// `UiThemeSwitcher` needs to `inject()`.
const ThemeProviderWrapper = defineComponent({
  props: {
    labels: { type: Object as () => ThemeSwitcherLabels, required: false, default: undefined },
  },
  setup(props) {
    createThemeContext();
    return () => h(UiThemeSwitcher, { labels: props.labels });
  },
});

function mountSwitcher(labels?: ThemeSwitcherLabels) {
  return mount(ThemeProviderWrapper, { props: { labels } });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  stubMatchMedia(false);
});

describe('UiThemeSwitcher', () => {
  it('renders the three theme options with the default English labels', () => {
    const wrapper = mountSwitcher();
    const items = wrapper.findAll('.ui-toggle-group__item');
    expect(items.map((item) => item.text())).toEqual(['Light', 'Dark', 'System']);
  });

  it('defaults to the "system" preference', async () => {
    const wrapper = mountSwitcher();
    await wrapper.vm.$nextTick();
    const active = wrapper.find('.ui-toggle-group__item--active');
    expect(active.text()).toBe('System');
  });

  it('switches the resolved theme and persists the choice on click', async () => {
    const wrapper = mountSwitcher();
    const items = wrapper.findAll('.ui-toggle-group__item');
    await items[1]?.trigger('click'); // 'dark'

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('ui-theme')).toBe('dark');
    expect(wrapper.find('.ui-toggle-group__item--active').text()).toBe('Dark');
  });

  it('accepts custom labels', () => {
    const wrapper = mountSwitcher({ light: 'Светлая', dark: 'Тёмная', system: 'Системная' });
    const items = wrapper.findAll('.ui-toggle-group__item');
    expect(items.map((item) => item.text())).toEqual(['Светлая', 'Тёмная', 'Системная']);
  });
});
