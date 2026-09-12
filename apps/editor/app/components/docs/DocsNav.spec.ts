import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import DocsNav from './DocsNav.vue';

function mountNav(path: string) {
  vi.stubGlobal('useRoute', () => ({ path }));
  const Harness = defineComponent({
    render() {
      return h(DocsNav);
    },
  });
  return mount(Harness, {
    global: { stubs: { NuxtLink: RouterLinkStub } },
  });
}

describe('DocsNav', () => {
  it('highlights Обзор on /docs', () => {
    const wrapper = mountNav('/docs');
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Обзор');
  });

  it('highlights Компоненты on a component detail route', () => {
    const wrapper = mountNav('/docs/components/ui-button');
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Компоненты');
  });
});
