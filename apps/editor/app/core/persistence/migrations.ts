import { createId, type SurfaceKind } from '@sandbox/ui-kit';
import { ShapeFactory } from '../model/ShapeFactory';
import { createDefaultSceneSettings, type SceneSettings } from '../model/SceneSettings';
import type { RoomSnapshot } from '../model/Room';
import { fingerprintPolygon } from '../model/Room';
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

export function createEmptySnapshot(): SceneSnapshot {
  return {
    objects: [],
    walls: [],
    rooms: [],
    settings: createDefaultSceneSettings(),
  };
}

/**
 * Normalize a raw record (or partial import) up to the current schema.
 * v0→v1: ensure settings exist. v1→v2: ensure walls array.
 * v2→v3: ensure rooms array (revalidated on document load).
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

  const snapshotRaw = isRecord(raw.snapshot) ? raw.snapshot : {};
  const objects = Array.isArray(snapshotRaw.objects) ? snapshotRaw.objects : [];
  // v1 → v2: projects without walls get an empty array.
  const wallsRaw = Array.isArray(snapshotRaw.walls) ? snapshotRaw.walls : [];
  // v2 → v3: projects without rooms get an empty array.
  const roomsRaw = Array.isArray(snapshotRaw.rooms) ? snapshotRaw.rooms : [];

  const snapshot: SceneSnapshot = {
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
    settings: ensureSettings(snapshotRaw.settings),
  };

  return {
    id,
    name,
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    snapshot,
  };
}
