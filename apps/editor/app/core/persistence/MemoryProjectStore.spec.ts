import { describe, expect, it } from 'vitest';
import { createDefaultSceneSettings } from '../model/SceneSettings';
import { MemoryProjectStore } from './MemoryProjectStore';
import { migrateProjectRecord } from './migrations';
import { CURRENT_SCHEMA_VERSION, type FloorRecord } from './ProjectStore';
import {
  createProjectRecord,
  getActiveFloor,
  parseImportedProject,
  serializeProject,
} from './serialize';

describe('MemoryProjectStore', () => {
  it('supports CRUD and sorts by updatedAt desc', async () => {
    const store = new MemoryProjectStore();
    const older = createProjectRecord('Older');
    older.updatedAt = 100;
    const newer = createProjectRecord('Newer');
    newer.updatedAt = 200;

    await store.save(older);
    await store.save(newer);

    const listed = await store.list();
    expect(listed.map((item) => item.name)).toEqual(['Newer', 'Older']);

    expect(await store.get(older.id)).toMatchObject({ name: 'Older' });
    await store.delete(older.id);
    expect(await store.get(older.id)).toBeNull();
    expect(await store.list()).toHaveLength(1);
  });
});

describe('migrateProjectRecord', () => {
  it('is a no-op upgrade for the current schema version', () => {
    const record = createProjectRecord('Demo');
    const migrated = migrateProjectRecord(record);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.name).toBe('Demo');
    expect(migrated.floors).toHaveLength(1);
    expect(getActiveFloor(migrated).snapshot.settings.field.width).toBe(
      createDefaultSceneSettings().field.width,
    );
  });

  it('wraps legacy flat snapshots into a single floor', () => {
    const migrated = migrateProjectRecord({
      id: 'p1',
      name: 'Legacy',
      updatedAt: 1,
      schemaVersion: 0,
      snapshot: { objects: [] },
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.floors).toHaveLength(1);
    expect(migrated.floors[0]!.name).toBe('Этаж 1');
    expect(migrated.floors[0]!.elevation).toBe(0);
    expect(migrated.floors[0]!.snapshot.walls).toEqual([]);
    expect(migrated.activeFloorId).toBe(migrated.floors[0]!.id);
  });

  it('migrates schemaVersion 4 flat snapshot into floors', () => {
    const migrated = migrateProjectRecord({
      id: 'p4',
      name: 'V4 project',
      updatedAt: 4,
      schemaVersion: 4,
      snapshot: {
        objects: [],
        walls: [
          {
            id: 'wall_1',
            start: { x: 0, z: 0 },
            end: { x: 4, z: 0 },
            height: 2.5,
            thickness: 0.2,
            surface: 'stone',
            color: '#d8d2c8',
          },
        ],
        rooms: [],
        openings: [],
        settings: createDefaultSceneSettings(),
      },
    });
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.floors).toHaveLength(1);
    expect(migrated.floors[0]!.snapshot.walls).toHaveLength(1);
  });

  it('preserves multi-floor projects', () => {
    const migrated = migrateProjectRecord({
      id: 'p5',
      name: 'Multi',
      updatedAt: 5,
      schemaVersion: 5,
      floors: [
        {
          id: 'f1',
          name: 'Этаж 1',
          elevation: 0,
          snapshot: {
            objects: [],
            walls: [],
            rooms: [],
            openings: [],
            settings: createDefaultSceneSettings(),
          },
        },
        {
          id: 'f2',
          name: 'Этаж 2',
          elevation: 3,
          snapshot: {
            objects: [],
            walls: [],
            rooms: [],
            openings: [],
            settings: createDefaultSceneSettings(),
          },
        },
      ],
      activeFloorId: 'f2',
    });
    expect(migrated.floors).toHaveLength(2);
    expect(migrated.activeFloorId).toBe('f2');
  });
});

describe('serialize / import', () => {
  it('round-trips a project through JSON without keeping the original id', () => {
    const original = createProjectRecord('Export me', {
      objects: [
        {
          id: 'shape_1',
          kind: 'cube',
          position: { x: 1, y: 0.5, z: 2 },
          rotationY: 0,
          scale: 1,
          surface: 'wood',
          color: '#c9945f',
        },
      ],
      walls: [
        {
          id: 'wall_1',
          start: { x: 0, z: 0 },
          end: { x: 2, z: 0 },
          height: 2.5,
          thickness: 0.2,
          surface: 'stone',
          color: '#d8d2c8',
        },
      ],
      rooms: [],
      openings: [],
      settings: createDefaultSceneSettings(),
    });

    const json = serializeProject(original);
    const imported = parseImportedProject(json);

    expect(imported.id).not.toBe(original.id);
    expect(imported.name).toBe('Export me');
    expect(imported.floors).toHaveLength(1);
    expect(imported.floors[0]!.snapshot.objects).toHaveLength(1);
    expect(imported.floors[0]!.snapshot.walls).toHaveLength(1);
    expect(imported.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('floor switch round-trip', () => {
  it('saving floor A then editing floor B does not clobber A', async () => {
    const store = new MemoryProjectStore();
    const record = createProjectRecord('Floors');
    const floor1 = record.floors[0]!;
    floor1.snapshot.walls = [
      {
        id: 'w1',
        start: { x: 0, z: 0 },
        end: { x: 2, z: 0 },
        height: 2.5,
        thickness: 0.2,
        surface: 'stone',
        color: '#d8d2c8',
      },
    ];
    const floor2: FloorRecord = {
      id: 'floor_2',
      name: 'Этаж 2',
      elevation: 3,
      snapshot: {
        objects: [],
        walls: [
          {
            id: 'w2',
            start: { x: 0, z: 0 },
            end: { x: 1, z: 1 },
            height: 2.5,
            thickness: 0.2,
            surface: 'wood',
            color: '#c9945f',
          },
        ],
        rooms: [],
        openings: [],
        settings: createDefaultSceneSettings(),
      },
      showCeiling: false,
    };
    record.floors.push(floor2);
    record.activeFloorId = floor1.id;
    await store.save(record);

    // Switch to floor 2 while persisting floor 1 snapshot
    const switched: typeof record = {
      ...record,
      floors: record.floors.map((f) =>
        f.id === floor1.id ? { ...f, snapshot: floor1.snapshot } : f,
      ),
      activeFloorId: floor2.id,
    };
    await store.save(switched);

    // Edit floor 2
    const editing = await store.get(record.id);
    expect(editing).toBeTruthy();
    const floors = editing!.floors.map((f) =>
      f.id === floor2.id
        ? {
            ...f,
            snapshot: {
              ...f.snapshot,
              walls: [
                ...f.snapshot.walls,
                {
                  id: 'w3',
                  start: { x: 5, z: 5 },
                  end: { x: 6, z: 5 },
                  height: 2.5,
                  thickness: 0.2,
                  surface: 'fabric' as const,
                  color: '#abc',
                },
              ],
            },
          }
        : f,
    );
    await store.save({ ...editing!, floors });

    const final = await store.get(record.id);
    const a = final!.floors.find((f) => f.id === floor1.id)!;
    const b = final!.floors.find((f) => f.id === floor2.id)!;
    expect(a.snapshot.walls).toHaveLength(1);
    expect(a.snapshot.walls[0]?.id).toBe('w1');
    expect(b.snapshot.walls).toHaveLength(2);
  });
});
