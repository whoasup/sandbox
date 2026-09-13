import { describe, expect, it } from 'vitest';
import { Room, polygonSignedArea } from './Room';

describe('Room area helpers', () => {
  it('computes rectangle area via shoelace', () => {
    const room = new Room({
      name: 'Кухня',
      polygon: [
        { x: 0, z: 0 },
        { x: 4, z: 0 },
        { x: 4, z: 3 },
        { x: 0, z: 3 },
      ],
      wallIds: [],
      fingerprint: 'rect',
    });
    expect(room.areaM2).toBe(12);
    expect(Math.abs(polygonSignedArea(room.polygon))).toBe(12);
    expect(room.centroid).toEqual({ x: 2, z: 1.5 });
  });

  it('computes L-shape area', () => {
    const room = new Room({
      name: 'L',
      polygon: [
        { x: 0, z: 0 },
        { x: 4, z: 0 },
        { x: 4, z: 2 },
        { x: 2, z: 2 },
        { x: 2, z: 4 },
        { x: 0, z: 4 },
      ],
      wallIds: [],
      fingerprint: 'l',
    });
    // 4×2 + 2×2 = 12
    expect(room.areaM2).toBe(12);
  });
});
