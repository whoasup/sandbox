import { mount } from '@vue/test-utils';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { h } from 'vue';
import EditorSplitPane from './EditorSplitPane.vue';

describe('EditorSplitPane', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders both panes and a resizable handle', () => {
    const wrapper = mount(EditorSplitPane, {
      slots: {
        left: () => h('div', { 'data-testid': 'left-slot' }, '2d'),
        right: () => h('div', { 'data-testid': 'right-slot' }, '3d'),
      },
      attachTo: document.body,
    });

    expect(wrapper.find('[data-testid="editor-split-pane"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="editor-split-handle"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="left-slot"]').text()).toBe('2d');
    expect(wrapper.find('[data-testid="right-slot"]').text()).toBe('3d');
    wrapper.unmount();
  });

  it('persists ratio to localStorage via keyboard adjustment', async () => {
    const wrapper = mount(EditorSplitPane, {
      slots: {
        left: () => h('div'),
        right: () => h('div'),
      },
      attachTo: document.body,
    });
    const handle = wrapper.find('[data-testid="editor-split-handle"]');
    await handle.trigger('keydown', { key: 'ArrowLeft' });
    const stored = Number(localStorage.getItem('sandbox:splitRatio'));
    expect(stored).toBeCloseTo(0.48, 2);
    wrapper.unmount();
  });
});
