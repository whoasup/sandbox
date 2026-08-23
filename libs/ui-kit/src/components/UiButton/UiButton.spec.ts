import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UiButton from './UiButton.vue';

describe('UiButton', () => {
  it('renders the default slot', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Launch' } });
    expect(wrapper.text()).toContain('Launch');
  });

  it('applies variant and size modifier classes', () => {
    const wrapper = mount(UiButton, { props: { variant: 'danger', size: 'lg' } });
    expect(wrapper.classes()).toContain('ui-button--danger');
    expect(wrapper.classes()).toContain('ui-button--lg');
  });

  it('emits click when interactive', async () => {
    const wrapper = mount(UiButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('marks itself busy and blocks clicks while loading', async () => {
    const wrapper = mount(UiButton, { props: { loading: true } });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('.ui-button__spinner').exists()).toBe(true);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
