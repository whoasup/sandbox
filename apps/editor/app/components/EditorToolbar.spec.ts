import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import EditorToolbar from './EditorToolbar.vue';

function mountToolbar() {
  const Harness = defineComponent({
    setup() {
      const ctx = createEditorDocumentContext();
      return { ctx };
    },
    render() {
      return h(EditorToolbar);
    },
  });
  return mount(Harness);
}

describe('EditorToolbar', () => {
  it('adds a shape when a shape button is clicked', async () => {
    const wrapper = mountToolbar();
    const cubeButton = wrapper.findAll('button').find((btn) => btn.text().includes('Куб'));
    expect(cubeButton).toBeTruthy();

    await cubeButton!.trigger('click');

    const harness = wrapper.vm as unknown as { ctx: ReturnType<typeof createEditorDocumentContext> };
    expect(harness.ctx.objects.value).toHaveLength(1);
    expect(harness.ctx.objects.value[0]?.kind).toBe('cube');
  });

  it('switches editor mode via the toggle group', async () => {
    const wrapper = mountToolbar();
    const harness = wrapper.vm as unknown as { ctx: ReturnType<typeof createEditorDocumentContext> };
    expect(harness.ctx.mode.value).toBe('3d');

    const twoDButton = wrapper.findAll('[role="tab"]').find((btn) => btn.text() === '2D');
    await twoDButton!.trigger('click');

    expect(harness.ctx.mode.value).toBe('2d');
  });

  it('disables the delete button until a shape is selected', async () => {
    const wrapper = mountToolbar();
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Удалить'));
    expect(deleteButton?.attributes('disabled')).toBeDefined();

    const cubeButton = wrapper.findAll('button').find((btn) => btn.text().includes('Куб'));
    await cubeButton!.trigger('click');

    expect(deleteButton?.attributes('disabled')).toBeUndefined();
  });
});
