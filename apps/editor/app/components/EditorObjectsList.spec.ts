import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import EditorObjectsList from './EditorObjectsList.vue';

function mountList() {
  const Harness = defineComponent({
    setup() {
      const ctx = createEditorDocumentContext();
      return { ctx };
    },
    render() {
      return h(EditorObjectsList);
    },
  });
  return mount(Harness);
}

describe('EditorObjectsList', () => {
  it('selects an entity when a list row is clicked', async () => {
    const wrapper = mountList();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };

    harness.ctx.addFurniture('table');
    const furnitureId = harness.ctx.furniture.value[0]!.id;
    harness.ctx.selectEntity(null);
    await wrapper.vm.$nextTick();

    expect(harness.ctx.selection.value).toBeNull();

    const row = wrapper.find(`[data-testid="objects-list-furniture-${furnitureId}"]`);
    expect(row.exists()).toBe(true);
    await row.trigger('click');

    expect(harness.ctx.selection.value).toEqual({ type: 'furniture', id: furnitureId });
  });

  it('lists shapes and furniture on the active floor', async () => {
    const wrapper = mountList();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };

    harness.ctx.addShape('cube');
    harness.ctx.addFurniture('sofa');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Куб');
    expect(wrapper.text()).toContain('Диван');
  });
});
