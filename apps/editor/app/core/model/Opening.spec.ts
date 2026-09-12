import { describe, expect, it } from 'vitest';
import { Opening, clampOpeningToWall, solidWallIntervals, openingSpanOnWall } from './Opening';

describe('Opening clamp helpers', () => {
  it('clamps width that exceeds wall length', () => {
    const result = clampOpeningToWall(2, 0.5, 5);
    expect(result.width).toBeLessThanOrEqual(2);
    expect(result.t).toBeCloseTo(0.5);
  });

  it('clamps t so the opening stays inside the wall', () => {
    const nearStart = clampOpeningToWall(4, 0, 1);
    expect(nearStart.t).toBeCloseTo(0.125);
    const nearEnd = clampOpeningToWall(4, 1, 1);
    expect(nearEnd.t).toBeCloseTo(0.875);
  });

  it('Opening.applyClamp uses wall length', () => {
    const opening = new Opening({ wallId: 'w1', type: 'door', t: 0, width: 10 });
    opening.applyClamp(3);
    expect(opening.width).toBeLessThanOrEqual(3);
    expect(opening.t).toBeGreaterThan(0);
    expect(opening.sill).toBe(0);
  });
});

describe('solidWallIntervals', () => {
  it('splits a wall around one opening', () => {
    const solids = solidWallIntervals(4, [{ t: 0.5, width: 1 }]);
    expect(solids).toHaveLength(2);
    expect(solids[0]!.t0).toBeCloseTo(0);
    expect(solids[0]!.t1).toBeCloseTo(0.375);
    expect(solids[1]!.t0).toBeCloseTo(0.625);
    expect(solids[1]!.t1).toBeCloseTo(1);
  });

  it('returns full wall when there are no openings', () => {
    expect(solidWallIntervals(4, [])).toEqual([{ t0: 0, t1: 1 }]);
  });
});

describe('openingSpanOnWall', () => {
  it('places the span centered at t', () => {
    const span = openingSpanOnWall({ x: 0, z: 0 }, { x: 4, z: 0 }, 0.5, 1);
    expect(span.a.x).toBeCloseTo(1.5);
    expect(span.b.x).toBeCloseTo(2.5);
  });
});
