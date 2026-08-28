import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { SHAPE_CATALOG } from '../../shapes';
import UiShapeIcon from './UiShapeIcon.vue';

describe('UiShapeIcon', () => {
  it.each(SHAPE_CATALOG.map((shape) => shape.kind))('renders a non-empty svg for "%s"', (kind) => {
    const wrapper = mount(UiShapeIcon, { props: { kind } });
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.element.children.length).toBeGreaterThan(0);
  });

  it('applies the requested size', () => {
    const wrapper = mount(UiShapeIcon, { props: { kind: 'cube', size: 48 } });
    expect(wrapper.find('svg').attributes('style')).toContain('48px');
  });

  it('defaults to a 24px size', () => {
    const wrapper = mount(UiShapeIcon, { props: { kind: 'sphere' } });
    expect(wrapper.find('svg').attributes('style')).toContain('24px');
  });
});
