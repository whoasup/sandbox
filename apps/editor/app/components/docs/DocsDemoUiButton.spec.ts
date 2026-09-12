import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DocsDemoUiButton from './DocsDemoUiButton.vue';

describe('DocsDemoUiButton', () => {
  it('increments the click counter when Primary is pressed', async () => {
    const wrapper = mount(DocsDemoUiButton);
    expect(wrapper.text()).toContain('Кликов по Primary: 0');

    const primary = wrapper.findAll('button').find((btn) => btn.text() === 'Primary');
    expect(primary).toBeTruthy();
    await primary!.trigger('click');

    expect(wrapper.text()).toContain('Кликов по Primary: 1');
  });
});
