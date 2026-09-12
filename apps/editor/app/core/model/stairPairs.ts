import type { FloorRecord, ProjectRecord } from '../persistence/ProjectStore';
import type { StairObjectSnapshot } from '../model/StairObject';
import { StairObject } from '../model/StairObject';

/**
 * Insert or sync a paired stair on the target floor when placing a stair
 * on the owning floor. Shared `linkId` ties the pair for delete cleanup.
 */
export function upsertStairPair(
  floors: FloorRecord[],
  stairSnap: StairObjectSnapshot,
): FloorRecord[] {
  const pair = StairObject.fromSnapshot(stairSnap).createPair().toSnapshot();
  return floors.map((floor) => {
    if (floor.id === stairSnap.floorId) {
      const stairs = [
        ...(floor.snapshot.stairs ?? []).filter((s) => s.linkId !== stairSnap.linkId),
        stairSnap,
      ];
      return { ...floor, snapshot: { ...floor.snapshot, stairs } };
    }
    if (floor.id === stairSnap.targetFloorId) {
      const stairs = [
        ...(floor.snapshot.stairs ?? []).filter((s) => s.linkId !== stairSnap.linkId),
        { ...pair, floorId: floor.id, targetFloorId: stairSnap.floorId },
      ];
      return { ...floor, snapshot: { ...floor.snapshot, stairs } };
    }
    return floor;
  });
}

/** Remove every stair sharing `linkId` from all floors. */
export function removeStairPair(floors: FloorRecord[], linkId: string): FloorRecord[] {
  return floors.map((floor) => ({
    ...floor,
    snapshot: {
      ...floor.snapshot,
      stairs: (floor.snapshot.stairs ?? []).filter((s) => s.linkId !== linkId),
    },
  }));
}

export function applyStairPairToProject(
  record: ProjectRecord,
  stairSnap: StairObjectSnapshot,
): ProjectRecord {
  return {
    ...record,
    floors: upsertStairPair(record.floors, stairSnap),
    updatedAt: Date.now(),
  };
}

export function removeStairPairFromProject(record: ProjectRecord, linkId: string): ProjectRecord {
  return {
    ...record,
    floors: removeStairPair(record.floors, linkId),
    updatedAt: Date.now(),
  };
}
