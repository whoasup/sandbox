import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiButton from './UiButton.vue';

describe('UiButton', () => {
  it('renders default slot content', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Click me' } });
    expect(wrapper.text()).toBe('Click me');
  });

  it('applies variant and size classes', () => {
    const wrapper = mount(UiButton, { props: { variant: 'primary', size: 'lg' } });
    expect(wrapper.classes()).toContain('ui-button--primary');
    expect(wrapper.classes()).toContain('ui-button--lg');
  });

  it('emits click when enabled', async () => {
    const wrapper = mount(UiButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('reflects pressed state via aria-pressed and class', () => {
    const wrapper = mount(UiButton, { props: { pressed: true } });
    expect(wrapper.attributes('aria-pressed')).toBe('true');
    expect(wrapper.classes()).toContain('ui-button--pressed');
  });

  it('renders an icon slot', () => {
    const wrapper = mount(UiButton, {
      slots: { icon: '<svg data-testid="icon" />' },
    });
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true);
  });
});
