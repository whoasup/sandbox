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
});
