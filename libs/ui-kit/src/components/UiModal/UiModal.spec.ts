import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import UiModal from './UiModal.vue';

/**
 * The dialog is teleported to `document.body`, so it lives outside the wrapper
 * subtree and has to be queried and driven through the real DOM.
 */
async function mountModal(props: Record<string, unknown> = {}) {
  const wrapper = mount(UiModal, {
    props: { modelValue: true, title: 'Scene settings', ...props },
    attachTo: document.body,
  });
  await nextTick();
  return wrapper;
}

function click(selector: string) {
  document.querySelector(selector)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function pressKey(key: string) {
  document
    .querySelector('.ui-modal__dialog')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('UiModal', () => {
  it('renders nothing while closed', async () => {
    await mountModal({ modelValue: false });
    expect(document.querySelector('.ui-modal')).toBeNull();
  });

  it('renders a labelled dialog when open', async () => {
    await mountModal({ description: 'Tweak the scene.' });
    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.ui-modal__title')?.textContent).toBe('Scene settings');

    const labelledBy = dialog?.getAttribute('aria-labelledby');
    expect(document.querySelector(`#${labelledBy}`)?.textContent).toBe('Scene settings');
  });

  it('closes on the close button', async () => {
    const wrapper = await mountModal();
    click('.ui-modal__close');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('closes on overlay click', async () => {
    const wrapper = await mountModal();
    click('.ui-modal__overlay');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('keeps the overlay inert when closeOnOverlay is false', async () => {
    const wrapper = await mountModal({ closeOnOverlay: false });
    click('.ui-modal__overlay');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('closes on Escape', async () => {
    const wrapper = await mountModal();
    pressKey('Escape');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('ignores Escape when closeOnEscape is false', async () => {
    const wrapper = await mountModal({ closeOnEscape: false });
    pressKey('Escape');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('locks body scrolling while open', async () => {
    const wrapper = await mountModal({ modelValue: false });

    await wrapper.setProps({ modelValue: true });
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ modelValue: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('can hide the close button', async () => {
    await mountModal({ hideCloseButton: true });
    expect(document.querySelector('.ui-modal__close')).toBeNull();
  });
});
