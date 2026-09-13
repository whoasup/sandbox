import { createId } from '@sandbox/ui-kit';
import { CURRENT_SCHEMA_VERSION, type FloorRecord, type ProjectRecord } from './ProjectStore';
import { createDefaultFloor, createEmptySnapshot, migrateProjectRecord } from './migrations';

/** Portable JSON shape (id is reassigned on import). */
export interface ProjectExportPayload {
  name: string;
  schemaVersion: number;
  floors: FloorRecord[];
  activeFloorId?: string;
}

export function createProjectRecord(
  name: string,
  snapshotOrFloors?: ReturnType<typeof createEmptySnapshot> | FloorRecord[],
): ProjectRecord {
  const floors = Array.isArray(snapshotOrFloors)
    ? snapshotOrFloors
    : [createDefaultFloor(snapshotOrFloors ?? createEmptySnapshot(), 1)];
  return {
    id: createId('project'),
    name: name.trim() || 'Без названия',
    updatedAt: Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    floors,
    activeFloorId: floors[0]?.id,
  };
}

export function serializeProject(record: ProjectRecord): string {
  const payload: ProjectExportPayload = {
    name: record.name,
    schemaVersion: record.schemaVersion,
    floors: record.floors,
    activeFloorId: record.activeFloorId,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseImportedProject(json: string): ProjectRecord {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    throw new Error('Invalid JSON');
  }

  const migrated = migrateProjectRecord({
    ...(typeof data === 'object' && data !== null ? data : {}),
    id: createId('project'),
    updatedAt: Date.now(),
  });

  return migrated;
}

export function downloadProjectJson(record: ProjectRecord): void {
  const blob = new Blob([serializeProject(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = record.name.replace(/[^\w\-а-яА-ЯёЁ]+/gi, '_').slice(0, 64) || 'project';
  anchor.href = url;
  anchor.download = `${safeName}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getActiveFloor(record: ProjectRecord): FloorRecord {
  const id = record.activeFloorId;
  return record.floors.find((f) => f.id === id) ?? record.floors[0]!;
}

function remapId(map: Map<string, string>, oldId: string, prefix: string): string {
  let next = map.get(oldId);
  if (!next) {
    next = createId(prefix);
    map.set(oldId, next);
  }
  return next;
}

/**
 * Clone floors for project duplication / templates: new floor and entity ids,
 * remapped stair floor/link refs, and remapped opening.wallId / room.wallIds
 * so references stay consistent inside the copy.
 */
export function cloneProjectFloors(floors: FloorRecord[]): FloorRecord[] {
  const floorIds = new Map(floors.map((floor) => [floor.id, createId('floor')]));
  const linkIds = new Map<string, string>();

  return floors.map((floor) => {
    const snapshot = structuredClone(floor.snapshot);
    const wallIds = new Map<string, string>();
    const roomIds = new Map<string, string>();

    snapshot.objects = (snapshot.objects ?? []).map((object) => ({
      ...object,
      id: createId('shape'),
    }));

    snapshot.walls = (snapshot.walls ?? []).map((wall) => {
      const id = remapId(wallIds, wall.id, 'wall');
      return { ...wall, id };
    });

    snapshot.rooms = (snapshot.rooms ?? []).map((room) => ({
      ...room,
      id: remapId(roomIds, room.id, 'room'),
      wallIds: (room.wallIds ?? []).map((wid) => wallIds.get(wid) ?? wid),
    }));

    snapshot.openings = (snapshot.openings ?? []).map((opening) => ({
      ...opening,
      id: createId('opening'),
      wallId: wallIds.get(opening.wallId) ?? opening.wallId,
    }));

    snapshot.furniture = (snapshot.furniture ?? []).map((item) => ({
      ...item,
      id: createId('furniture'),
    }));

    snapshot.dimensions = (snapshot.dimensions ?? []).map((dim) => ({
      ...dim,
      id: createId('dim'),
    }));

    snapshot.stairs = (snapshot.stairs ?? []).map((stair) => {
      let linkId = linkIds.get(stair.linkId);
      if (!linkId) {
        linkId = createId('stairlink');
        linkIds.set(stair.linkId, linkId);
      }
      return {
        ...stair,
        id: createId('stair'),
        linkId,
        floorId: floorIds.get(stair.floorId) ?? stair.floorId,
        targetFloorId: floorIds.get(stair.targetFloorId) ?? stair.targetFloorId,
      };
    });

    return {
      ...floor,
      id: floorIds.get(floor.id) ?? createId('floor'),
      snapshot,
    };
  });
}
