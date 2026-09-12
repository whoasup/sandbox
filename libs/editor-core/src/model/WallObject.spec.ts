import { describe, expect, it } from 'vitest';
import { WallObject } from './WallObject';

describe('WallObject', () => {
  it('computes length and midpoint', () => {
    const wall = new WallObject({
      start: { x: 0, z: 0 },
      end: { x: 3, z: 4 },
    });
    expect(wall.length).toBe(5);
    expect(wall.midpoint).toEqual({ x: 1.5, z: 2 });
  });

  it('translates both endpoints together', () => {
    const wall = new WallObject({
      start: { x: 0, z: 0 },
      end: { x: 2, z: 0 },
    });
    wall.translate(1, -1);
    expect(wall.start).toEqual({ x: 1, z: -1 });
    expect(wall.end).toEqual({ x: 3, z: -1 });
  });

  it('hit-tests near the segment with thickness padding', () => {
    const wall = new WallObject({
      start: { x: 0, z: 0 },
      end: { x: 4, z: 0 },
      thickness: 0.2,
    });
    expect(wall.hits({ x: 2, z: 0.1 })).toBe(true);
    expect(wall.hits({ x: 2, z: 1 })).toBe(false);
  });

  it('round-trips through toSnapshot / fromSnapshot', () => {
    const wall = new WallObject({
      start: { x: 1, z: 2 },
      end: { x: 3, z: 2 },
      height: 3,
      thickness: 0.3,
      surface: 'stone',
      color: '#aa0000',
    });
    const clone = WallObject.fromSnapshot(wall.toSnapshot());
    expect(clone.toSnapshot()).toEqual(wall.toSnapshot());
  });
});
