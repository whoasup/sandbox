import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createThemeContext } from '@sandbox/ui-kit';
import { defineComponent, h } from 'vue';
import AppSidebar from './AppSidebar.vue';

function stubMatchMedia(): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function mountSidebar(path = '/') {
  stubMatchMedia();
  // Nuxt auto-imports `useRoute`; stub it for Vitest.
  vi.stubGlobal('useRoute', () => ({ path }));

  const Harness = defineComponent({
    setup() {
      createThemeContext();
    },
    render() {
      return h(AppSidebar);
    },
  });

  return mount(Harness, {
    global: {
      stubs: {
        NuxtLink: RouterLinkStub,
      },
    },
  });
}

describe('AppSidebar', () => {
  it('renders the three primary nav destinations', () => {
    const wrapper = mountSidebar('/');
    const text = wrapper.text();
    expect(text).toContain('Проекты');
    expect(text).toContain('Редактор');
    expect(text).toContain('Документация');
  });

  it('marks Проекты as the current page on /', () => {
    const wrapper = mountSidebar('/');
    const current = wrapper.find('[aria-current="page"]');
    expect(current.exists()).toBe(true);
    expect(current.text()).toBe('Проекты');
  });

  it('marks Редактор as current on an editor route', () => {
    const wrapper = mountSidebar('/editor/draft');
    const current = wrapper.find('[aria-current="page"]');
    expect(current.text()).toBe('Редактор');
  });

  it('hosts the theme switcher in the shell', () => {
    const wrapper = mountSidebar('/');
    expect(wrapper.findComponent({ name: 'UiThemeSwitcher' }).exists()).toBe(true);
  });
});
