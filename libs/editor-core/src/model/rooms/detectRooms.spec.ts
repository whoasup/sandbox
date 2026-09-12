import { describe, expect, it } from 'vitest';
import { WallObject } from '../WallObject';
import { detectRooms } from './detectRooms';
import { fingerprintPolygon } from '../Room';

function wall(x1: number, z1: number, x2: number, z2: number, id?: string): WallObject {
  return new WallObject({
    id,
    start: { x: x1, z: z1 },
    end: { x: x2, z: z2 },
  });
}

describe('detectRooms', () => {
  it('finds one room for a closed square', () => {
    const walls = [
      wall(0, 0, 4, 0, 'w0'),
      wall(4, 0, 4, 4, 'w1'),
      wall(4, 4, 0, 4, 'w2'),
      wall(0, 4, 0, 0, 'w3'),
    ];
    const rooms = detectRooms(walls);
    expect(rooms).toHaveLength(1);
    expect(rooms[0]!.polygon).toHaveLength(4);
    expect(rooms[0]!.wallIds).toEqual(['w0', 'w1', 'w2', 'w3']);
    expect(rooms[0]!.signedArea).toBeGreaterThan(0);
  });

  it('finds two rooms for adjacent rectangles sharing a wall', () => {
    // Two 2×2 rooms side by side: left [0,0]-[2,2], right [2,0]-[4,2]
    const walls = [
      wall(0, 0, 2, 0, 'bottomL'),
      wall(2, 0, 4, 0, 'bottomR'),
      wall(4, 0, 4, 2, 'right'),
      wall(4, 2, 2, 2, 'topR'),
      wall(2, 2, 0, 2, 'topL'),
      wall(0, 2, 0, 0, 'left'),
      wall(2, 0, 2, 2, 'shared'),
    ];
    const rooms = detectRooms(walls);
    expect(rooms).toHaveLength(2);
    expect(rooms.every((r) => r.signedArea > 0)).toBe(true);
    const fingerprints = new Set(rooms.map((r) => r.fingerprint));
    expect(fingerprints.size).toBe(2);
  });

  it('returns zero rooms for an open U-shape', () => {
    const walls = [wall(0, 0, 0, 4, 'left'), wall(0, 4, 4, 4, 'top'), wall(4, 4, 4, 0, 'right')];
    expect(detectRooms(walls)).toHaveLength(0);
  });

  it('returns zero rooms for a single diagonal wall', () => {
    expect(detectRooms([wall(0, 0, 3, 3, 'diag')])).toHaveLength(0);
  });

  it('produces stable fingerprints independent of wall order', () => {
    const a = [wall(0, 0, 3, 0), wall(3, 0, 3, 3), wall(3, 3, 0, 3), wall(0, 3, 0, 0)];
    const b = [...a].reverse();
    const roomsA = detectRooms(a);
    const roomsB = detectRooms(b);
    expect(roomsA).toHaveLength(1);
    expect(roomsB).toHaveLength(1);
    expect(roomsA[0]!.fingerprint).toBe(roomsB[0]!.fingerprint);
  });

  it('fingerprintPolygon is rotation/direction invariant', () => {
    const poly = [
      { x: 0, z: 0 },
      { x: 2, z: 0 },
      { x: 2, z: 2 },
      { x: 0, z: 2 },
    ];
    const rotated = [...poly.slice(2), ...poly.slice(0, 2)];
    const reversed = [...poly].reverse();
    expect(fingerprintPolygon(poly)).toBe(fingerprintPolygon(rotated));
    expect(fingerprintPolygon(poly)).toBe(fingerprintPolygon(reversed));
  });
});
