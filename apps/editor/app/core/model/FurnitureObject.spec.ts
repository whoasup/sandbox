import { describe, expect, it } from 'vitest';
import { FurnitureObject } from './FurnitureObject';

describe('FurnitureObject', () => {
  it('rests on the floor using catalog height and scale', () => {
    const chair = new FurnitureObject({ catalogId: 'chair', scale: 2 });
    expect(chair.restingHeight).toBeCloseTo(0.9);
    expect(chair.position.y).toBeCloseTo(0.9);
    expect(chair.footprint.width).toBeCloseTo(1);
  });

  it('round-trips through snapshot', () => {
    const bed = new FurnitureObject({
      catalogId: 'bed',
      position: { x: 2, z: -1 },
      rotationY: 0.5,
      scale: 1.2,
      surface: 'fabric',
      color: '#112233',
    });
    const clone = FurnitureObject.fromSnapshot(bed.toSnapshot());
    expect(clone.catalogId).toBe('bed');
    expect(clone.position.x).toBe(2);
    expect(clone.position.z).toBe(-1);
    expect(clone.rotationY).toBe(0.5);
    expect(clone.scale).toBe(1.2);
    expect(clone.surface).toBe('fabric');
    expect(clone.color).toBe('#112233');
  });
});
