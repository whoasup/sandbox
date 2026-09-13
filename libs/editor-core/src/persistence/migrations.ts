import {
  createId,
  getFurniturePreset,
  isFurnitureCatalogId,
  type SurfaceKind,
} from '@sandbox/ui-kit';
import { ShapeFactory } from '../model/ShapeFactory';
import { createDefaultSceneSettings, type SceneSettings } from '../model/SceneSettings';
import type { FurnitureObjectSnapshot } from '../model/FurnitureObject';
import type { OpeningSnapshot, OpeningType } from '../model/Opening';
import type { RoomSnapshot } from '../model/Room';
import { fingerprintPolygon } from '../model/Room';
import type { DimensionLineSnapshot } from '../model/DimensionLine';
import type { StairDirection, StairObjectSnapshot } from '../model/StairObject';
import type { SceneSnapshot } from '../model/types';
import type { WallObjectSnapshot } from '../model/WallObject';
import { CURRENT_SCHEMA_VERSION, type ProjectRecord } from './ProjectStore';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ensureSettings(value: unknown): SceneSettings {
  if (!isRecord(value)) return createDefaultSceneSettings();
  const defaults = createDefaultSceneSettings();
  const background = isRecord(value.background) ? value.background : {};
  const field = isRecord(value.field) ? value.field : {};
  const floor = isRecord(value.floor) ? value.floor : {};
  return {
    background: {
      mode: background.mode === 'color' ? 'color' : 'preset',
      color: typeof background.color === 'string' ? background.color : defaults.background.color,
      preset:
        background.preset === 'day' ||
        background.preset === 'night' ||
        background.preset === 'studio'
          ? background.preset
          : defaults.background.preset,
    },
    field: {
      width: typeof field.width === 'number' ? field.width : defaults.field.width,
      depth: typeof field.depth === 'number' ? field.depth : defaults.field.depth,
      gridVisible:
        typeof field.gridVisible === 'boolean' ? field.gridVisible : defaults.field.gridVisible,
      gridStep: typeof field.gridStep === 'number' ? field.gridStep : defaults.field.gridStep,
      snap: typeof field.snap === 'boolean' ? field.snap : defaults.field.snap,
      axesVisible:
        typeof field.axesVisible === 'boolean' ? field.axesVisible : defaults.field.axesVisible,
      wallLengthsVisible:
        typeof field.wallLengthsVisible === 'boolean'
          ? field.wallLengthsVisible
          : defaults.field.wallLengthsVisible,
      roomAreasVisible:
        typeof field.roomAreasVisible === 'boolean'
          ? field.roomAreasVisible
          : defaults.field.roomAreasVisible,
      compassVisible:
        typeof field.compassVisible === 'boolean'
          ? field.compassVisible
          : defaults.field.compassVisible,
    },
    floor: {
      color: typeof floor.color === 'string' ? floor.color : defaults.floor.color,
      surface:
        typeof floor.surface === 'string'
          ? (floor.surface as SceneSettings['floor']['surface'])
          : defaults.floor.surface,
    },
  };
}

function parseWallSnapshot(value: unknown): WallObjectSnapshot | null {
  if (!isRecord(value)) return null;
  const start = isRecord(value.start) ? value.start : {};
  const end = isRecord(value.end) ? value.end : {};
  const surface =
    value.surface === 'wood' || value.surface === 'fabric' || value.surface === 'stone'
      ? value.surface
      : 'stone';
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('wall'),
    start: {
      x: Number(start.x) || 0,
      z: Number(start.z) || 0,
    },
    end: {
      x: Number(end.x) || 0,
      z: Number(end.z) || 0,
    },
    height: typeof value.height === 'number' && Number.isFinite(value.height) ? value.height : 2.5,
    thickness:
      typeof value.thickness === 'number' && Number.isFinite(value.thickness)
        ? value.thickness
        : 0.2,
    surface,
    color: typeof value.color === 'string' ? value.color : '#d8d2c8',
  };
}

function parseRoomSnapshot(value: unknown): RoomSnapshot | null {
  if (!isRecord(value)) return null;
  const polygonRaw = Array.isArray(value.polygon) ? value.polygon : [];
  const polygon = polygonRaw
    .filter(isRecord)
    .map((p) => ({ x: Number(p.x) || 0, z: Number(p.z) || 0 }));
  if (polygon.length < 3) return null;
  const surface =
    value.floorSurface === 'wood' ||
    value.floorSurface === 'fabric' ||
    value.floorSurface === 'stone'
      ? (value.floorSurface as SurfaceKind)
      : undefined;
  const wallIds = Array.isArray(value.wallIds)
    ? value.wallIds.filter((id): id is string => typeof id === 'string')
    : [];
  const fingerprint =
    typeof value.fingerprint === 'string' && value.fingerprint.length > 0
      ? value.fingerprint
      : fingerprintPolygon(polygon);
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('room'),
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Комната',
    polygon,
    floorSurface: surface,
    floorColor: typeof value.floorColor === 'string' ? value.floorColor : '#c8b89a',
    wallIds,
    fingerprint,
  };
}

function parseOpeningSnapshot(value: unknown): OpeningSnapshot | null {
  if (!isRecord(value)) return null;
  const type: OpeningType | null =
    value.type === 'door' || value.type === 'window' ? value.type : null;
  if (!type) return null;
  const wallId = typeof value.wallId === 'string' ? value.wallId : '';
  if (!wallId) return null;
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('opening'),
    wallId,
    type,
    t: typeof value.t === 'number' && Number.isFinite(value.t) ? value.t : 0.5,
    width: typeof value.width === 'number' && Number.isFinite(value.width) ? value.width : 0.9,
    height: typeof value.height === 'number' && Number.isFinite(value.height) ? value.height : 2.1,
    sill: typeof value.sill === 'number' && Number.isFinite(value.sill) ? value.sill : 0,
  };
}

function parseFurnitureSnapshot(value: unknown): FurnitureObjectSnapshot | null {
  if (!isRecord(value)) return null;
  const catalogId =
    typeof value.catalogId === 'string' && isFurnitureCatalogId(value.catalogId)
      ? value.catalogId
      : null;
  if (!catalogId) return null;
  const position = isRecord(value.position) ? value.position : {};
  const surface =
    value.surface === 'wood' || value.surface === 'fabric' || value.surface === 'stone'
      ? value.surface
      : 'wood';
  const preset = getFurniturePreset(catalogId);
  const scale =
    typeof value.scale === 'number' && Number.isFinite(value.scale) && value.scale > 0
      ? value.scale
      : 1;
  const width =
    typeof value.width === 'number' && Number.isFinite(value.width) && value.width > 0
      ? value.width
      : preset.footprint.width * scale;
  const depth =
    typeof value.depth === 'number' && Number.isFinite(value.depth) && value.depth > 0
      ? value.depth
      : preset.footprint.depth * scale;
  const height =
    typeof value.height === 'number' && Number.isFinite(value.height) && value.height > 0
      ? value.height
      : preset.height * scale;
  const derivedScale =
    (width / preset.footprint.width + depth / preset.footprint.depth + height / preset.height) / 3;
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('furniture'),
    catalogId,
    position: {
      x: Number(position.x) || 0,
      y: Number(position.y) || 0,
      z: Number(position.z) || 0,
    },
    rotationY:
      typeof value.rotationY === 'number' && Number.isFinite(value.rotationY) ? value.rotationY : 0,
    scale: derivedScale,
    width,
    depth,
    height,
    surface,
    color: typeof value.color === 'string' ? value.color : '#c9945f',
  };
}

function parseStairSnapshot(value: unknown): StairObjectSnapshot | null {
  if (!isRecord(value)) return null;
  const floorId = typeof value.floorId === 'string' ? value.floorId : '';
  const targetFloorId = typeof value.targetFloorId === 'string' ? value.targetFloorId : '';
  if (!floorId || !targetFloorId || floorId === targetFloorId) return null;
  const position = isRecord(value.position) ? value.position : {};
  const direction: StairDirection = value.direction === 'down' ? 'down' : 'up';
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('stair'),
    linkId: typeof value.linkId === 'string' && value.linkId ? value.linkId : createId('stairlink'),
    floorId,
    targetFloorId,
    position: { x: Number(position.x) || 0, z: Number(position.z) || 0 },
    rotationY:
      typeof value.rotationY === 'number' && Number.isFinite(value.rotationY) ? value.rotationY : 0,
    width: typeof value.width === 'number' && Number.isFinite(value.width) ? value.width : 1,
    depth: typeof value.depth === 'number' && Number.isFinite(value.depth) ? value.depth : 2.5,
    stepCount:
      typeof value.stepCount === 'number' && Number.isFinite(value.stepCount)
        ? Math.max(3, Math.round(value.stepCount))
        : 12,
    direction,
  };
}

function parseDimensionSnapshot(value: unknown): DimensionLineSnapshot | null {
  if (!isRecord(value)) return null;
  const start = isRecord(value.start) ? value.start : {};
  const end = isRecord(value.end) ? value.end : {};
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId('dim'),
    start: {
      x: Number(start.x) || 0,
      z: Number(start.z) || 0,
    },
    end: {
      x: Number(end.x) || 0,
      z: Number(end.z) || 0,
    },
    offset: typeof value.offset === 'number' && Number.isFinite(value.offset) ? value.offset : 0.35,
  };
}

export function createEmptySnapshot(): SceneSnapshot {
  return {
    objects: [],
    walls: [],
    rooms: [],
    openings: [],
    furniture: [],
    stairs: [],
    dimensions: [],
    settings: createDefaultSceneSettings(),
  };
}

function parseSceneSnapshot(raw: unknown): SceneSnapshot {
  const snapshotRaw = isRecord(raw) ? raw : {};
  const objects = Array.isArray(snapshotRaw.objects) ? snapshotRaw.objects : [];
  const wallsRaw = Array.isArray(snapshotRaw.walls) ? snapshotRaw.walls : [];
  const roomsRaw = Array.isArray(snapshotRaw.rooms) ? snapshotRaw.rooms : [];
  const openingsRaw = Array.isArray(snapshotRaw.openings) ? snapshotRaw.openings : [];
  const furnitureRaw = Array.isArray(snapshotRaw.furniture) ? snapshotRaw.furniture : [];
  const stairsRaw = Array.isArray(snapshotRaw.stairs) ? snapshotRaw.stairs : [];
  const dimensionsRaw = Array.isArray(snapshotRaw.dimensions) ? snapshotRaw.dimensions : [];

  return {
    objects: objects
      .filter(isRecord)
      .filter((object) => typeof object.kind === 'string' && ShapeFactory.supports(object.kind))
      .map((object) => ({
        id: String(object.id ?? ''),
        kind: object.kind as SceneSnapshot['objects'][number]['kind'],
        position: isRecord(object.position)
          ? {
              x: Number(object.position.x) || 0,
              y: Number(object.position.y) || 0,
              z: Number(object.position.z) || 0,
            }
          : { x: 0, y: 0, z: 0 },
        rotationY: Number(object.rotationY) || 0,
        scale: Number(object.scale) || 1,
        surface: object.surface as SceneSnapshot['objects'][number]['surface'],
        color: typeof object.color === 'string' ? object.color : '#c9945f',
      })),
    walls: wallsRaw
      .map(parseWallSnapshot)
      .filter((wall): wall is WallObjectSnapshot => wall !== null),
    rooms: roomsRaw.map(parseRoomSnapshot).filter((room): room is RoomSnapshot => room !== null),
    openings: openingsRaw
      .map(parseOpeningSnapshot)
      .filter((opening): opening is OpeningSnapshot => opening !== null),
    furniture: furnitureRaw
      .map(parseFurnitureSnapshot)
      .filter((item): item is FurnitureObjectSnapshot => item !== null),
    stairs: stairsRaw
      .map(parseStairSnapshot)
      .filter((stair): stair is StairObjectSnapshot => stair !== null),
    dimensions: dimensionsRaw
      .map(parseDimensionSnapshot)
      .filter((dim): dim is DimensionLineSnapshot => dim !== null),
    settings: ensureSettings(snapshotRaw.settings),
  };
}

export function createDefaultFloor(snapshot = createEmptySnapshot(), index = 1) {
  return {
    id: createId('floor'),
    name: `Этаж ${index}`,
    elevation: (index - 1) * 3,
    snapshot,
    showCeiling: false,
  };
}

/**
 * Normalize a raw record (or partial import) up to the current schema.
 * v0→v1: ensure settings exist. v1→v2: ensure walls array.
 * v2→v3: ensure rooms array. v3→v4: ensure openings array.
 * v4→v5: wrap flat snapshot into floors[].
 * v5→v6: ensure furniture array on each floor snapshot.
 * v6→v7: ensure stairs array on each floor snapshot.
 * v7→v8: ensure dimensions array on each floor snapshot.
 * v8→v9: furniture width/depth/height from preset × scale when missing.
 */
export function migrateProjectRecord(raw: unknown): ProjectRecord {
  if (!isRecord(raw)) {
    throw new Error('Invalid project record');
  }

  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : null;
  if (!id || !name) {
    throw new Error('Project record requires id and name');
  }

  const schemaVersion =
    typeof raw.schemaVersion === 'number' && Number.isFinite(raw.schemaVersion)
      ? raw.schemaVersion
      : 0;

  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion ${schemaVersion} (max ${CURRENT_SCHEMA_VERSION})`);
  }

  let floors: ProjectRecord['floors'];

  if (Array.isArray(raw.floors) && raw.floors.length > 0) {
    floors = raw.floors.filter(isRecord).map((floor, index) => ({
      id: typeof floor.id === 'string' && floor.id ? floor.id : createId('floor'),
      name:
        typeof floor.name === 'string' && floor.name.trim()
          ? floor.name.trim()
          : `Этаж ${index + 1}`,
      elevation:
        typeof floor.elevation === 'number' && Number.isFinite(floor.elevation)
          ? floor.elevation
          : index * 3,
      snapshot: parseSceneSnapshot(floor.snapshot),
      showCeiling: floor.showCeiling === true,
    }));
  } else {
    // Legacy flat snapshot → single floor.
    floors = [createDefaultFloor(parseSceneSnapshot(raw.snapshot), 1)];
  }

  if (floors.length === 0) {
    floors = [createDefaultFloor()];
  }

  const activeFloorId =
    typeof raw.activeFloorId === 'string' && floors.some((f) => f.id === raw.activeFloorId)
      ? raw.activeFloorId
      : floors[0]!.id;

  return {
    id,
    name,
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    floors,
    activeFloorId,
  };
}

/** Migrate a stored record and report whether the schema version changed. */
export function hydrateStoredRecord(raw: unknown): {
  record: ProjectRecord;
  upgraded: boolean;
} {
  if (!isRecord(raw)) {
    throw new Error('Invalid project record');
  }
  const incoming =
    typeof raw.schemaVersion === 'number' && Number.isFinite(raw.schemaVersion)
      ? raw.schemaVersion
      : 0;
  const record = migrateProjectRecord(raw);
  return { record, upgraded: incoming !== CURRENT_SCHEMA_VERSION };
}

export function tryHydrateStoredRecord(
  raw: unknown,
): { record: ProjectRecord; upgraded: boolean } | null {
  try {
    return hydrateStoredRecord(raw);
  } catch {
    return null;
  }
}
