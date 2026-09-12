import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppShellHeader from './AppShellHeader.vue';

describe('AppShellHeader', () => {
  it('exposes a menu trigger with aria-expanded', async () => {
    const wrapper = mount(AppShellHeader, {
      props: { expanded: false },
    });
    const trigger = wrapper.get('[data-testid="app-nav-menu"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ expanded: true });
    expect(wrapper.get('[data-testid="app-nav-menu"]').attributes('aria-expanded')).toBe('true');
  });

  it('emits toggle when the menu button is clicked', async () => {
    const wrapper = mount(AppShellHeader, {
      props: { expanded: false },
    });
    await wrapper.get('[data-testid="app-nav-menu"]').trigger('click');
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });
});
