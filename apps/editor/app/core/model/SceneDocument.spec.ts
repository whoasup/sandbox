import { describe, expect, it } from 'vitest';
import { SceneDocument } from './SceneDocument';

describe('SceneDocument', () => {
  it('adds a shape and selects it automatically', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');

    expect(doc.list()).toHaveLength(1);
    expect(doc.selected?.id).toBe(shape.id);
  });

  it('emits "change" with the current object list on every mutation', () => {
    const doc = new SceneDocument();
    const events: number[] = [];
    doc.on('change', (objects) => events.push(objects.length));

    doc.addShape('cube');
    doc.addShape('sphere');

    expect(events).toEqual([1, 2]);
  });

  it('emits "select" only when the selection actually changes', () => {
    const doc = new SceneDocument();
    const selections: (string | null)[] = [];
    doc.on('select', (id) => selections.push(id));

    const shape = doc.addShape('cube');
    doc.select(shape.id);
    doc.select(null);

    expect(selections).toEqual([shape.id, null]);
  });

  it('removes a shape and clears selection if it was selected', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cylinder');

    doc.remove(shape.id);

    expect(doc.list()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('moves a shape, keeping it resting on the floor', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('pyramid');

    doc.moveShape(shape.id, 3, -2);

    expect(shape.position.x).toBe(3);
    expect(shape.position.z).toBe(-2);
    expect(shape.position.y).toBe(shape.restingHeight);
  });

  it('updates surface and color independently', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube', { surface: 'wood', color: '#ffffff' });

    doc.setSurface(shape.id, 'stone');
    doc.setColor(shape.id, '#123456');

    expect(shape.surface).toBe('stone');
    expect(shape.color).toBe('#123456');
  });

  it('clears the entire document', () => {
    const doc = new SceneDocument();
    doc.addShape('cube');
    doc.addShape('sphere');

    doc.clear();

    expect(doc.list()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('replaceKind keeps id, transform, and material', () => {
    const doc = new SceneDocument();
    const cube = doc.addShape('cube', {
      position: { x: 2, z: -1 },
      rotationY: 0.5,
      scale: 1.5,
      surface: 'stone',
      color: '#abcdef',
    });
    const id = cube.id;

    const sphere = doc.replaceKind(id, 'sphere');

    expect(sphere.id).toBe(id);
    expect(sphere.kind).toBe('sphere');
    expect(sphere.position.x).toBe(2);
    expect(sphere.position.z).toBe(-1);
    expect(sphere.rotationY).toBe(0.5);
    expect(sphere.scale).toBe(1.5);
    expect(sphere.surface).toBe('stone');
    expect(sphere.color).toBe('#abcdef');
    expect(doc.selected?.id).toBe(id);
    expect(doc.list()).toHaveLength(1);
  });

  it('duplicate creates a new object with a new id', () => {
    const doc = new SceneDocument();
    const original = doc.addShape('cube', { position: { x: 0, z: 0 }, scale: 2 });

    const clone = doc.duplicate(original.id);

    expect(clone).toBeTruthy();
    expect(clone!.id).not.toBe(original.id);
    expect(clone!.kind).toBe('cube');
    expect(clone!.scale).toBe(2);
    expect(doc.list()).toHaveLength(2);
    expect(doc.selected?.id).toBe(clone!.id);
  });

  it('setRotationY and setScale update the selected object', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');

    doc.setRotationY(shape.id, Math.PI / 2);
    doc.setScale(shape.id, 2);

    expect(shape.rotationY).toBe(Math.PI / 2);
    expect(shape.scale).toBe(2);
    expect(shape.position.y).toBe(shape.restingHeight);
  });

  it('patchSettings emits settings and is included in toSnapshot', () => {
    const doc = new SceneDocument();
    const events: boolean[] = [];
    doc.on('settings', (settings) => events.push(settings.field.snap));

    doc.patchSettings({ field: { snap: true, gridStep: 0.5 } });

    expect(events).toEqual([true]);
    expect(doc.settings.field.snap).toBe(true);
    expect(doc.settings.field.gridStep).toBe(0.5);
    expect(doc.toSnapshot().settings.field.snap).toBe(true);
  });

  it('moveShape snaps to the grid when snap is enabled', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');
    doc.patchSettings({ field: { snap: true, gridStep: 1 } });

    doc.moveShape(shape.id, 1.4, -1.6);

    expect(shape.position.x).toBe(1);
    expect(shape.position.z).toBe(-2);
  });
});
