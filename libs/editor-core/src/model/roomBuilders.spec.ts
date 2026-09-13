import { describe, expect, it } from 'vitest';
import { SceneDocument } from './SceneDocument';
import { addLShapedRoom, addRectangularRoom } from './roomBuilders';

const EPS = 1e-6;

describe('addRectangularRoom', () => {
  it('creates 4 walls and 1 room with matching dimensions', () => {
    const doc = new SceneDocument();
    const { wallIds, roomId } = addRectangularRoom(doc, {
      origin: { x: 1, z: 2 },
      width: 4,
      depth: 3,
      name: 'Гостиная',
    });

    expect(wallIds).toHaveLength(4);
    expect(doc.listWalls()).toHaveLength(4);
    expect(doc.listRooms()).toHaveLength(1);
    expect(roomId).toBeTruthy();
    expect(doc.listRooms()[0]!.id).toBe(roomId);
    expect(doc.listRooms()[0]!.name).toBe('Гостиная');
    expect(doc.listRooms()[0]!.areaM2).toBeCloseTo(12, 5);

    const xs = doc.listWalls().flatMap((w) => [w.start.x, w.end.x]);
    const zs = doc.listWalls().flatMap((w) => [w.start.z, w.end.z]);
    expect(Math.min(...xs)).toBeCloseTo(1, 5);
    expect(Math.max(...xs)).toBeCloseTo(5, 5);
    expect(Math.min(...zs)).toBeCloseTo(2, 5);
    expect(Math.max(...zs)).toBeCloseTo(5, 5);
  });

  it('normalizes negative width/depth to min-corner origin', () => {
    const doc = new SceneDocument();
    addRectangularRoom(doc, {
      origin: { x: 4, z: 5 },
      width: -3,
      depth: -2,
    });
    const xs = doc.listWalls().flatMap((w) => [w.start.x, w.end.x]);
    const zs = doc.listWalls().flatMap((w) => [w.start.z, w.end.z]);
    expect(Math.min(...xs) + EPS).toBeGreaterThanOrEqual(1);
    expect(Math.min(...xs)).toBeCloseTo(1, 5);
    expect(Math.max(...xs)).toBeCloseTo(4, 5);
    expect(Math.min(...zs)).toBeCloseTo(3, 5);
    expect(Math.max(...zs)).toBeCloseTo(5, 5);
  });
});

describe('addLShapedRoom', () => {
  it('creates 6 outer walls and at least one room', () => {
    const doc = new SceneDocument();
    const { wallIds, roomId } = addLShapedRoom(doc, {
      origin: { x: 0, z: 0 },
      width: 6,
      depth: 4,
      cutWidth: 2,
      cutDepth: 2,
      name: 'Студия',
    });

    expect(wallIds.length).toBeGreaterThanOrEqual(5);
    expect(wallIds).toHaveLength(6);
    expect(doc.listWalls()).toHaveLength(6);
    expect(doc.listRooms().length).toBeGreaterThanOrEqual(1);
    expect(roomId).toBeTruthy();
    expect(doc.listRooms().find((r) => r.id === roomId)?.name).toBe('Студия');
    // Full 6×4 minus 2×2 cut = 20 m²
    expect(doc.listRooms()[0]!.areaM2).toBeCloseTo(20, 4);
  });
});
