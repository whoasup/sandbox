import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { createEditorDocumentContext, type EditorDocumentContext } from './useEditorDocument';

function mountWithContext(assert: (ctx: EditorDocumentContext) => void) {
  const Harness = defineComponent({
    setup() {
      const ctx = createEditorDocumentContext();
      assert(ctx);
      return () => h('div');
    },
  });
  return mount(Harness);
}

describe('createEditorDocumentContext', () => {
  it('starts empty, in 3D mode, with a wood surface preset', () => {
    mountWithContext((ctx) => {
      expect(ctx.objects.value).toEqual([]);
      expect(ctx.mode.value).toBe('3d');
      expect(ctx.activeSurface.value).toBe('wood');
    });
  });

  it('places shapes without overlapping the origin twice', () => {
    mountWithContext((ctx) => {
      ctx.addShape('cube');
      ctx.addShape('sphere');
      expect(ctx.objects.value).toHaveLength(2);
      const [first, second] = ctx.objects.value;
      expect(first).toBeDefined();
      expect(first?.position).toEqual({ x: 0, y: first!.restingHeight, z: 0 });
      expect(second?.position.x).not.toBe(0);
    });
  });

  it('applies the active surface/color to newly added shapes', () => {
    mountWithContext((ctx) => {
      ctx.applySurfaceToSelection('stone');
      ctx.applyColorToSelection('#336699');
      ctx.addShape('cube');
      expect(ctx.objects.value[0]?.surface).toBe('stone');
      expect(ctx.objects.value[0]?.color).toBe('#336699');
    });
  });

  it('removes the selected shape', () => {
    mountWithContext((ctx) => {
      ctx.addShape('cube');
      expect(ctx.objects.value).toHaveLength(1);
      ctx.removeSelected();
      expect(ctx.objects.value).toHaveLength(0);
      expect(ctx.selectedId.value).toBeNull();
    });
  });

  it('moves a shape via moveShape', () => {
    mountWithContext((ctx) => {
      ctx.addShape('cube');
      const id = ctx.objects.value[0]!.id;
      ctx.moveShape(id, 2, 3);
      expect(ctx.objects.value[0]?.position.x).toBe(2);
      expect(ctx.objects.value[0]?.position.z).toBe(3);
    });
  });
});
