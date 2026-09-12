import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import EditorScenePanel from './EditorScenePanel.vue';

function mountPanel() {
  const Harness = defineComponent({
    setup() {
      const ctx = createEditorDocumentContext();
      return { ctx };
    },
    render() {
      return h(EditorScenePanel);
    },
  });
  return mount(Harness);
}

describe('EditorScenePanel', () => {
  it('renders scene / field controls', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('Сцена / поле');
    expect(wrapper.text()).toContain('Сетка');
    expect(wrapper.text()).toContain('Snap');
  });

  it('toggles snap via the panel button', async () => {
    const wrapper = mountPanel();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };
    expect(harness.ctx.settings.value.field.snap).toBe(false);

    const snapButton = wrapper.findAll('button').find((btn) => btn.text().includes('Snap'));
    expect(snapButton).toBeTruthy();
    await snapButton!.trigger('click');

    expect(harness.ctx.settings.value.field.snap).toBe(true);
  });

  it('toggles grid visibility', async () => {
    const wrapper = mountPanel();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };
    expect(harness.ctx.settings.value.field.gridVisible).toBe(true);

    const gridButton = wrapper.findAll('button').find((btn) => btn.text().includes('Сетка'));
    await gridButton!.trigger('click');

    expect(harness.ctx.settings.value.field.gridVisible).toBe(false);
  });
});
