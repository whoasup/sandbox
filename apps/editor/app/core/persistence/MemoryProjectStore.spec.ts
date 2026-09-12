import { describe, expect, it } from 'vitest';
import { createDefaultSceneSettings } from '../model/SceneSettings';
import { MemoryProjectStore } from './MemoryProjectStore';
import { migrateProjectRecord } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './ProjectStore';
import { createProjectRecord, parseImportedProject, serializeProject } from './serialize';

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
    expect(migrated.snapshot.settings.field.width).toBe(createDefaultSceneSettings().field.width);
  });

  it('fills missing settings for schemaVersion 0 stubs', () => {
    const migrated = migrateProjectRecord({
      id: 'p1',
      name: 'Legacy',
      updatedAt: 1,
      schemaVersion: 0,
      snapshot: { objects: [] },
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.snapshot.settings.background.mode).toBe('preset');
    expect(migrated.snapshot.walls).toEqual([]);
  });

  it('migrates schemaVersion 1 snapshots by adding an empty walls array', () => {
    const migrated = migrateProjectRecord({
      id: 'p2',
      name: 'V1 project',
      updatedAt: 2,
      schemaVersion: 1,
      snapshot: {
        objects: [],
        settings: createDefaultSceneSettings(),
      },
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.snapshot.walls).toEqual([]);
    expect(migrated.snapshot.rooms).toEqual([]);
  });

  it('migrates schemaVersion 2 snapshots by adding an empty rooms array', () => {
    const migrated = migrateProjectRecord({
      id: 'p2b',
      name: 'V2 project',
      updatedAt: 2,
      schemaVersion: 2,
      snapshot: {
        objects: [],
        walls: [],
        settings: createDefaultSceneSettings(),
      },
    });
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.snapshot.rooms).toEqual([]);
  });

  it('parses wall snapshots on migrate', () => {
    const migrated = migrateProjectRecord({
      id: 'p3',
      name: 'With walls',
      updatedAt: 3,
      schemaVersion: 2,
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
        settings: createDefaultSceneSettings(),
      },
    });
    expect(migrated.snapshot.walls).toHaveLength(1);
    expect(migrated.snapshot.walls[0]?.id).toBe('wall_1');
    expect(migrated.snapshot.walls[0]?.end.x).toBe(4);
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
      settings: createDefaultSceneSettings(),
    });

    const json = serializeProject(original);
    const imported = parseImportedProject(json);

    expect(imported.id).not.toBe(original.id);
    expect(imported.name).toBe('Export me');
    expect(imported.snapshot.objects).toHaveLength(1);
    expect(imported.snapshot.objects[0]?.kind).toBe('cube');
    expect(imported.snapshot.walls).toHaveLength(1);
    expect(imported.snapshot.walls[0]?.id).toBe('wall_1');
    expect(imported.snapshot.rooms).toEqual([]);
    expect(imported.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
