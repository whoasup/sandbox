import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiTextureSwatch from './UiTextureSwatch.vue';

describe('UiTextureSwatch', () => {
  it('renders a canvas sized to the `size` prop', () => {
    const wrapper = mount(UiTextureSwatch, { props: { surface: 'wood', size: 40 } });
    const canvas = wrapper.find('canvas');
    expect(canvas.attributes('width')).toBe('40');
    expect(canvas.attributes('height')).toBe('40');
  });

  it('applies the selected modifier class', () => {
    const wrapper = mount(UiTextureSwatch, { props: { surface: 'stone', selected: true } });
    expect(wrapper.classes()).toContain('ui-texture-swatch--selected');
  });

  it('falls back to the surface label for aria-label', () => {
    const wrapper = mount(UiTextureSwatch, { props: { surface: 'fabric' } });
    expect(wrapper.attributes('aria-label')).toBe('Ткань');
  });
});
