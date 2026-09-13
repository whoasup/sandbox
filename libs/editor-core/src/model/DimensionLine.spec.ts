import { describe, expect, it } from 'vitest';
import { DimensionLine } from './DimensionLine';
import { SceneDocument } from './SceneDocument';

describe('DimensionLine', () => {
  it('computes length between endpoints', () => {
    const dim = new DimensionLine({
      start: { x: 0, z: 0 },
      end: { x: 3, z: 4 },
    });
    expect(dim.length).toBe(5);
    expect(dim.offset).toBe(0.35);
  });

  it('round-trips through snapshot', () => {
    const dim = new DimensionLine({
      id: 'dim_1',
      start: { x: 1, z: 2 },
      end: { x: 4, z: 6 },
      offset: 0.5,
    });
    const restored = DimensionLine.fromSnapshot(dim.toSnapshot());
    expect(restored.toSnapshot()).toEqual(dim.toSnapshot());
  });
});

describe('SceneDocument dimensions', () => {
  it('adds, updates, and removes dimension lines with undo-friendly snapshots', () => {
    const doc = new SceneDocument();
    const dim = doc.addDimension({ start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });

    expect(doc.listDimensions()).toHaveLength(1);
    expect(doc.selected).toEqual({ type: 'dimension', id: dim.id });
    expect(doc.toSnapshot().dimensions).toHaveLength(1);

    doc.updateDimension(dim.id, { end: { x: 5, z: 0 }, offset: 0.4 });
    expect(doc.getDimension(dim.id)?.length).toBe(5);
    expect(doc.getDimension(dim.id)?.offset).toBe(0.4);

    doc.removeDimension(dim.id);
    expect(doc.listDimensions()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('restores dimensions from snapshot', () => {
    const doc = new SceneDocument();
    doc.addDimension({ start: { x: 0, z: 0 }, end: { x: 1, z: 1 } });
    const snap = doc.toSnapshot();

    const other = new SceneDocument();
    other.fromSnapshot(snap);
    expect(other.listDimensions()).toHaveLength(1);
    expect(other.listDimensions()[0]!.length).toBeCloseTo(Math.SQRT2);
  });
});
