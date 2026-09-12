import { describe, expect, it } from 'vitest';
import { createDefaultSceneSettings } from './SceneSettings';
import { StairObject } from './StairObject';
import { removeStairPair, upsertStairPair } from './stairPairs';
import type { FloorRecord } from '../persistence/ProjectStore';

function emptyFloor(id: string, name: string): FloorRecord {
  return {
    id,
    name,
    elevation: 0,
    snapshot: {
      objects: [],
      walls: [],
      rooms: [],
      openings: [],
      furniture: [],
      stairs: [],
      settings: createDefaultSceneSettings(),
    },
  };
}

describe('stairPairs', () => {
  it('upserts paired stairs on both floors and cleans on remove', () => {
    const floors = [emptyFloor('f1', 'Этаж 1'), emptyFloor('f2', 'Этаж 2')];
    const stair = new StairObject({
      floorId: 'f1',
      targetFloorId: 'f2',
      position: { x: 2, z: 1 },
      direction: 'up',
    }).toSnapshot();

    const paired = upsertStairPair(floors, stair);
    expect(paired[0]!.snapshot.stairs).toHaveLength(1);
    expect(paired[1]!.snapshot.stairs).toHaveLength(1);
    expect(paired[1]!.snapshot.stairs[0]!.linkId).toBe(stair.linkId);
    expect(paired[1]!.snapshot.stairs[0]!.direction).toBe('down');

    const cleared = removeStairPair(paired, stair.linkId);
    expect(cleared[0]!.snapshot.stairs).toEqual([]);
    expect(cleared[1]!.snapshot.stairs).toEqual([]);
  });
});
