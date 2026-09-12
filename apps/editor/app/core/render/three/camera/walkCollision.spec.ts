import { describe, expect, it } from 'vitest';
import { WallObject } from '../../../model/WallObject';
import { collidesWithWalls, resolveWalkMove } from './walkCollision';

describe('walkCollision', () => {
  const wall = new WallObject({
    start: { x: 0, z: 0 },
    end: { x: 4, z: 0 },
    thickness: 0.2,
  });

  it('detects points near a wall segment', () => {
    expect(collidesWithWalls({ x: 2, z: 0 }, [wall], 0.35)).toBe(true);
    expect(collidesWithWalls({ x: 2, z: 2 }, [wall], 0.35)).toBe(false);
  });

  it('slides along axes when blocked', () => {
    const from = { x: 2, z: 1 };
    const intoWall = { x: 2, z: 0.05 };
    const resolved = resolveWalkMove(from, intoWall, [wall], 0.35);
    expect(resolved.z).toBeGreaterThan(0.1);
  });
});
