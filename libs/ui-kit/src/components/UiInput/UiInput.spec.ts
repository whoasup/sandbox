import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UiInput from './UiInput.vue';

describe('UiInput', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(UiInput);
    await wrapper.find('input').setValue('torus');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['torus']);
  });

  it('links the label to the control', () => {
    const wrapper = mount(UiInput, { props: { label: 'Scene name' } });
    const id = wrapper.find('input').attributes('id');
    expect(wrapper.find('label').attributes('for')).toBe(id);
  });

  it('exposes the hint through aria-describedby', () => {
    const wrapper = mount(UiInput, { props: { hint: 'Lowercase only' } });
    const describedBy = wrapper.find('input').attributes('aria-describedby');
    expect(describedBy).toBeDefined();
    expect(wrapper.find(`#${describedBy}`).text()).toBe('Lowercase only');
  });

  it('prefers the error message over the hint and flags invalid state', () => {
    const wrapper = mount(UiInput, { props: { hint: 'Lowercase only', error: 'Already taken' } });
    expect(wrapper.find('.ui-input__message').text()).toBe('Already taken');
    expect(wrapper.classes()).toContain('ui-input--invalid');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
  });
});
