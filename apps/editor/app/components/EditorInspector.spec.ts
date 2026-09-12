import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { createEditorDocumentContext } from '../composables/useEditorDocument';
import EditorInspector from './EditorInspector.vue';

function mountInspector() {
  const Harness = defineComponent({
    setup() {
      const ctx = createEditorDocumentContext();
      return { ctx };
    },
    render() {
      return h(EditorInspector);
    },
  });
  return mount(Harness);
}

describe('EditorInspector', () => {
  it('shows empty state when nothing is selected', () => {
    const wrapper = mountInspector();
    expect(wrapper.text()).toContain('Выберите объект на сцене');
  });

  it('exposes kind controls after a shape is added', async () => {
    const wrapper = mountInspector();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };
    harness.ctx.addShape('cube');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Инспектор');
    expect(wrapper.text()).toContain('Поворот');
    expect(wrapper.text()).toContain('Дублировать');
  });

  it('replaceSelectedKind switches the selected object kind', async () => {
    const wrapper = mountInspector();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };
    harness.ctx.addShape('cube');
    await wrapper.vm.$nextTick();

    harness.ctx.replaceSelectedKind('sphere');
    await wrapper.vm.$nextTick();

    expect(harness.ctx.objects.value[0]?.kind).toBe('sphere');
  });

  it('enables furniture controls when furniture is selected', async () => {
    const wrapper = mountInspector();
    const harness = wrapper.vm as unknown as {
      ctx: ReturnType<typeof createEditorDocumentContext>;
    };
    harness.ctx.addFurniture('table');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="furniture-inspector"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Стол');
    expect(wrapper.text()).toContain('Поворот');
    expect(wrapper.text()).toContain('Дублировать');
  });
});
