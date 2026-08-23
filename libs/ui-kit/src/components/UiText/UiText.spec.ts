import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UiText from './UiText.vue';

describe('UiText', () => {
  it('maps variants to semantic tags', () => {
    expect(mount(UiText, { props: { variant: 'display' } }).element.tagName).toBe('H1');
    expect(mount(UiText, { props: { variant: 'heading' } }).element.tagName).toBe('H2');
    expect(mount(UiText, { props: { variant: 'body' } }).element.tagName).toBe('P');
    expect(mount(UiText, { props: { variant: 'code' } }).element.tagName).toBe('CODE');
  });

  it('honours an explicit tag override', () => {
    const wrapper = mount(UiText, { props: { variant: 'heading', as: 'div' } });
    expect(wrapper.element.tagName).toBe('DIV');
  });

  it('applies tone and truncation classes', () => {
    const wrapper = mount(UiText, { props: { tone: 'danger', truncate: true } });
    expect(wrapper.classes()).toContain('ui-text--tone-danger');
    expect(wrapper.classes()).toContain('ui-text--truncate');
  });

  it('turns size and weight props into token references', () => {
    const wrapper = mount(UiText, { props: { size: 'xl', weight: 'bold' } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('var(--ui-font-size-xl)');
    expect(style).toContain('var(--ui-font-weight-bold)');
  });
});
