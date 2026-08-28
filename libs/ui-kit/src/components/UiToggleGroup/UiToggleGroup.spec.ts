import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiToggleGroup from './UiToggleGroup.vue';

const options = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

describe('UiToggleGroup', () => {
  it('renders one item per option', () => {
    const wrapper = mount(UiToggleGroup, { props: { modelValue: '2d', options } });
    const items = wrapper.findAll('.ui-toggle-group__item');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toBe('2D');
    expect(items[1]?.text()).toBe('3D');
  });

  it('marks the active option', () => {
    const wrapper = mount(UiToggleGroup, { props: { modelValue: '3d', options } });
    const active = wrapper.find('.ui-toggle-group__item--active');
    expect(active.text()).toBe('3D');
  });

  it('emits update:modelValue on click', async () => {
    const wrapper = mount(UiToggleGroup, { props: { modelValue: '2d', options } });
    await wrapper.findAll('.ui-toggle-group__item')[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['3d']);
  });

  it('does not emit for a disabled option', async () => {
    const wrapper = mount(UiToggleGroup, {
      props: { modelValue: '2d', options: [...options, { value: 'vr', label: 'VR', disabled: true }] },
    });
    await wrapper.findAll('.ui-toggle-group__item')[2]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
