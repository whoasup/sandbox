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
      expect(ctx.selection.value).toBeNull();
    });
  });

  it('adds and removes walls via the document bridge', () => {
    mountWithContext((ctx) => {
      ctx.addWall({ x: 0, z: 0 }, { x: 3, z: 0 });
      expect(ctx.walls.value).toHaveLength(1);
      expect(ctx.selection.value?.type).toBe('wall');
      ctx.removeSelected();
      expect(ctx.walls.value).toHaveLength(0);
    });
  });

  it('duplicates the selected wall', () => {
    mountWithContext((ctx) => {
      ctx.addWall({ x: 0, z: 0 }, { x: 3, z: 0 });
      expect(ctx.walls.value).toHaveLength(1);
      ctx.duplicateSelected();
      expect(ctx.walls.value).toHaveLength(2);
    });
  });

  it('syncs stair pair hooks on undo', () => {
    mountWithContext((ctx) => {
      ctx.setFloorContext({
        activeFloorId: 'floor_1',
        floors: [
          { id: 'floor_1', name: 'Этаж 1' },
          { id: 'floor_2', name: 'Этаж 2' },
        ],
      });
      const upserts: string[] = [];
      const removed: string[] = [];
      ctx.setStairProjectHooks({
        onStairUpsert: (stair) => upserts.push(stair.linkId),
        onStairRemoved: (linkId) => removed.push(linkId),
      });
      ctx.addStairAtPoint({ x: 1, z: 1 });
      expect(ctx.stairs.value).toHaveLength(1);
      expect(upserts).toHaveLength(1);
      ctx.undo();
      expect(ctx.stairs.value).toHaveLength(0);
      expect(removed).toEqual(upserts);
    });
  });

  it('adds a rectangular room as one history entry', () => {
    mountWithContext((ctx) => {
      ctx.addRoomRect({ x: 0, z: 0 }, 4, 3, { name: 'Зал' });
      expect(ctx.walls.value).toHaveLength(4);
      expect(ctx.rooms.value).toHaveLength(1);
      expect(ctx.rooms.value[0]?.name).toBe('Зал');
      expect(ctx.canUndo.value).toBe(true);
      ctx.undo();
      expect(ctx.walls.value).toHaveLength(0);
      expect(ctx.rooms.value).toHaveLength(0);
    });
  });

  it('places a pending room from the size dialog at a click point', () => {
    mountWithContext((ctx) => {
      ctx.setPendingRoomPlacement({ width: 3, depth: 4, name: 'Кухня' });
      expect(ctx.pendingRoomPlacement.value).toBeTruthy();
      expect(ctx.tool.value).toBe('room');
      expect(ctx.mode.value).toBe('2d');
      const placed = ctx.placePendingRoomAt({ x: 1.5, z: 2 });
      expect(placed).toBe(true);
      expect(ctx.pendingRoomPlacement.value).toBeNull();
      expect(ctx.walls.value).toHaveLength(4);
      expect(ctx.rooms.value[0]?.name).toBe('Кухня');
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
