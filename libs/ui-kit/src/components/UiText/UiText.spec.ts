import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiText from './UiText.vue';

describe('UiText', () => {
  it('renders the default slot', () => {
    const wrapper = mount(UiText, { slots: { default: 'Hello' } });
    expect(wrapper.text()).toBe('Hello');
  });

  it('renders the requested tag via `as`', () => {
    const wrapper = mount(UiText, { props: { as: 'h2' }, slots: { default: 'Title' } });
    expect(wrapper.element.tagName).toBe('H2');
  });

  it('defaults to a span', () => {
    const wrapper = mount(UiText);
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('applies size/weight/tone modifier classes', () => {
    const wrapper = mount(UiText, { props: { size: 'lg', weight: 'bold', tone: 'danger' } });
    expect(wrapper.classes()).toContain('ui-text--size-lg');
    expect(wrapper.classes()).toContain('ui-text--weight-bold');
    expect(wrapper.classes()).toContain('ui-text--tone-danger');
  });
});
