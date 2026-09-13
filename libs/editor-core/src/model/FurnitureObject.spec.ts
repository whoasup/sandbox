import { describe, expect, it } from 'vitest';
import { FurnitureObject } from './FurnitureObject';

describe('FurnitureObject', () => {
  it('rests on the floor using explicit height (legacy scale expands dims)', () => {
    const chair = new FurnitureObject({ catalogId: 'chair', scale: 2 });
    expect(chair.height).toBeCloseTo(1.8);
    expect(chair.width).toBeCloseTo(1);
    expect(chair.depth).toBeCloseTo(1);
    expect(chair.restingHeight).toBeCloseTo(0.9);
    expect(chair.position.y).toBeCloseTo(0.9);
    expect(chair.footprint.width).toBeCloseTo(1);
    expect(chair.scale).toBeCloseTo(2);
  });

  it('setSize updates individual dimensions and footprint', () => {
    const table = new FurnitureObject({ catalogId: 'table' });
    table.setSize({ width: 2.1, depth: 0.9, height: 0.8 });
    expect(table.width).toBeCloseTo(2.1);
    expect(table.depth).toBeCloseTo(0.9);
    expect(table.height).toBeCloseTo(0.8);
    expect(table.footprint).toEqual({ width: 2.1, depth: 0.9 });
    expect(table.restingHeight).toBeCloseTo(0.4);
  });

  it('setScale scales all three dimensions proportionally', () => {
    const sofa = new FurnitureObject({
      catalogId: 'sofa',
      width: 2,
      depth: 1,
      height: 0.8,
    });
    const before = { w: sofa.width, d: sofa.depth, h: sofa.height, s: sofa.scale };
    sofa.setScale(before.s * 2);
    expect(sofa.width).toBeCloseTo(before.w * 2);
    expect(sofa.depth).toBeCloseTo(before.d * 2);
    expect(sofa.height).toBeCloseTo(before.h * 2);
  });

  it('round-trips through snapshot with width/depth/height', () => {
    const bed = new FurnitureObject({
      catalogId: 'bed',
      position: { x: 2, z: -1 },
      rotationY: 0.5,
      width: 1.8,
      depth: 2.2,
      height: 0.6,
      surface: 'fabric',
      color: '#112233',
    });
    const snap = bed.toSnapshot();
    expect(snap.width).toBeCloseTo(1.8);
    expect(snap.depth).toBeCloseTo(2.2);
    expect(snap.height).toBeCloseTo(0.6);
    expect(snap.scale).toBeGreaterThan(0);

    const clone = FurnitureObject.fromSnapshot(snap);
    expect(clone.catalogId).toBe('bed');
    expect(clone.position.x).toBe(2);
    expect(clone.position.z).toBe(-1);
    expect(clone.rotationY).toBe(0.5);
    expect(clone.width).toBeCloseTo(1.8);
    expect(clone.depth).toBeCloseTo(2.2);
    expect(clone.height).toBeCloseTo(0.6);
    expect(clone.surface).toBe('fabric');
    expect(clone.color).toBe('#112233');
  });
});
