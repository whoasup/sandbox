import { describe, expect, it } from 'vitest';
import { assertValidStairTarget, StairObject } from './StairObject';

describe('StairObject', () => {
  it('rejects same-floor targets', () => {
    expect(() => assertValidStairTarget('f1', 'f1')).toThrow(/differ/);
  });

  it('creates an inverted pair sharing linkId', () => {
    const stair = new StairObject({
      floorId: 'f1',
      targetFloorId: 'f2',
      position: { x: 1, z: 2 },
      direction: 'up',
      stepCount: 10,
    });
    const pair = stair.createPair();
    expect(pair.linkId).toBe(stair.linkId);
    expect(pair.floorId).toBe('f2');
    expect(pair.targetFloorId).toBe('f1');
    expect(pair.direction).toBe('down');
    expect(pair.position).toEqual(stair.position);
  });

  it('round-trips through snapshot', () => {
    const stair = new StairObject({
      floorId: 'a',
      targetFloorId: 'b',
      width: 1.2,
      depth: 3,
      stepCount: 14,
      rotationY: 0.5,
    });
    const clone = StairObject.fromSnapshot(stair.toSnapshot());
    expect(clone.toSnapshot()).toEqual(stair.toSnapshot());
  });
});
