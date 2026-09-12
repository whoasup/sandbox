import { describe, expect, it } from 'vitest';
import { WallObject } from '../model/WallObject';
import { snapAngle45, snapPointPipeline, snapToGrid, snapToWallEndpoints } from './snapPoint';

describe('snap helpers', () => {
  it('snaps to grid', () => {
    expect(snapToGrid({ x: 1.4, z: -1.6 }, 1)).toEqual({ x: 1, z: -2 });
  });

  it('snaps to wall endpoints', () => {
    const wall = new WallObject({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    expect(snapToWallEndpoints({ x: 0.2, z: 0.1 }, [wall], 0.35)).toEqual({ x: 0, z: 0 });
  });

  it('snaps angles to 45° increments', () => {
    const from = { x: 0, z: 0 };
    const to = { x: 1, z: 0.1 };
    const snapped = snapAngle45(from, to, 45);
    expect(snapped.z).toBeCloseTo(0, 5);
    expect(snapped.x).toBeCloseTo(Math.hypot(1, 0.1), 5);
  });

  it('pipeline prefers endpoints over grid', () => {
    const wall = new WallObject({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    const result = snapPointPipeline({ x: 0.2, z: 0.1 }, [wall], {
      snapEnabled: true,
      gridStep: 1,
      endpointRadius: 0.35,
    });
    expect(result).toEqual({ x: 0, z: 0 });
  });
});
