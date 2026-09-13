import { describe, expect, it } from 'vitest';
import { SceneDocument } from './SceneDocument';
import type { SelectionRef } from './types';

describe('SceneDocument', () => {
  it('adds a shape and selects it automatically', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');

    expect(doc.list()).toHaveLength(1);
    expect(doc.selected).toEqual({ type: 'shape', id: shape.id });
  });

  it('emits "change" with objects, walls, rooms, openings, and furniture on every mutation', () => {
    const doc = new SceneDocument();
    const events: {
      objects: number;
      walls: number;
      rooms: number;
      openings: number;
      furniture: number;
    }[] = [];
    doc.on('change', (payload) =>
      events.push({
        objects: payload.objects.length,
        walls: payload.walls.length,
        rooms: payload.rooms.length,
        openings: payload.openings.length,
        furniture: payload.furniture.length,
      }),
    );

    doc.addShape('cube');
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });
    doc.addFurniture('chair');

    expect(events).toEqual([
      { objects: 1, walls: 0, rooms: 0, openings: 0, furniture: 0 },
      { objects: 1, walls: 1, rooms: 0, openings: 0, furniture: 0 },
      { objects: 1, walls: 1, rooms: 0, openings: 0, furniture: 1 },
    ]);
  });

  it('emits "select" only when the selection actually changes', () => {
    const doc = new SceneDocument();
    const selections: SelectionRef[] = [];
    doc.on('select', (ref) => selections.push(ref));

    const shape = doc.addShape('cube');
    doc.select({ type: 'shape', id: shape.id });
    doc.select(null);

    expect(selections).toEqual([{ type: 'shape', id: shape.id }, null]);
  });

  it('removes a shape and clears selection if it was selected', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cylinder');

    doc.remove(shape.id);

    expect(doc.list()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('moves a shape, keeping it resting on the floor', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('pyramid');

    doc.moveShape(shape.id, 3, -2);

    expect(shape.position.x).toBe(3);
    expect(shape.position.z).toBe(-2);
    expect(shape.position.y).toBe(shape.restingHeight);
  });

  it('updates surface and color independently', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube', { surface: 'wood', color: '#ffffff' });

    doc.setSurface(shape.id, 'stone');
    doc.setColor(shape.id, '#123456');

    expect(shape.surface).toBe('stone');
    expect(shape.color).toBe('#123456');
  });

  it('clears the entire document including walls', () => {
    const doc = new SceneDocument();
    doc.addShape('cube');
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 1, z: 0 } });

    doc.clear();

    expect(doc.list()).toHaveLength(0);
    expect(doc.listWalls()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('replaceKind keeps id, transform, and material', () => {
    const doc = new SceneDocument();
    const cube = doc.addShape('cube', {
      position: { x: 2, z: -1 },
      rotationY: 0.5,
      scale: 1.5,
      surface: 'stone',
      color: '#abcdef',
    });
    const id = cube.id;

    const sphere = doc.replaceKind(id, 'sphere');

    expect(sphere.id).toBe(id);
    expect(sphere.kind).toBe('sphere');
    expect(sphere.position.x).toBe(2);
    expect(sphere.position.z).toBe(-1);
    expect(sphere.rotationY).toBe(0.5);
    expect(sphere.scale).toBe(1.5);
    expect(sphere.surface).toBe('stone');
    expect(sphere.color).toBe('#abcdef');
    expect(doc.selected).toEqual({ type: 'shape', id });
    expect(doc.list()).toHaveLength(1);
  });

  it('duplicate creates a new object with a new id', () => {
    const doc = new SceneDocument();
    const original = doc.addShape('cube', { position: { x: 0, z: 0 }, scale: 2 });

    const clone = doc.duplicate(original.id);

    expect(clone).toBeTruthy();
    expect(clone!.id).not.toBe(original.id);
    expect(clone!.kind).toBe('cube');
    expect(clone!.scale).toBe(2);
    expect(doc.list()).toHaveLength(2);
    expect(doc.selected).toEqual({ type: 'shape', id: clone!.id });
  });

  it('setRotationY and setScale update the selected object', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');

    doc.setRotationY(shape.id, Math.PI / 2);
    doc.setScale(shape.id, 2);

    expect(shape.rotationY).toBe(Math.PI / 2);
    expect(shape.scale).toBe(2);
    expect(shape.position.y).toBe(shape.restingHeight);
  });

  it('patchSettings emits settings and is included in toSnapshot', () => {
    const doc = new SceneDocument();
    const events: boolean[] = [];
    doc.on('settings', (settings) => events.push(settings.field.snap));

    doc.patchSettings({ field: { snap: true, gridStep: 0.5 } });

    expect(events).toEqual([true]);
    expect(doc.settings.field.snap).toBe(true);
    expect(doc.settings.field.gridStep).toBe(0.5);
    expect(doc.toSnapshot().settings.field.snap).toBe(true);
  });

  it('moveShape snaps to the grid when snap is enabled', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('cube');
    doc.patchSettings({ field: { snap: true, gridStep: 1 } });

    doc.moveShape(shape.id, 1.4, -1.6);

    expect(shape.position.x).toBe(1);
    expect(shape.position.z).toBe(-2);
  });

  it('adds, moves, and removes walls', () => {
    const doc = new SceneDocument();
    const wall = doc.addWall({
      start: { x: 0, z: 0 },
      end: { x: 4, z: 0 },
      height: 2.5,
      thickness: 0.2,
    });

    expect(doc.listWalls()).toHaveLength(1);
    expect(doc.selected).toEqual({ type: 'wall', id: wall.id });

    doc.moveWall(wall.id, 2, 3);
    expect(wall.midpoint.x).toBeCloseTo(2);
    expect(wall.midpoint.z).toBeCloseTo(3);
    expect(wall.start).toEqual({ x: 0, z: 3 });
    expect(wall.end).toEqual({ x: 4, z: 3 });

    doc.setWallHeight(wall.id, 3);
    doc.setWallThickness(wall.id, 0.4);
    doc.setWallSurface(wall.id, 'wood');
    doc.setWallColor(wall.id, '#ff0000');
    expect(wall.height).toBe(3);
    expect(wall.thickness).toBe(0.4);
    expect(wall.surface).toBe('wood');
    expect(wall.color).toBe('#ff0000');

    doc.removeSelected();
    expect(doc.listWalls()).toHaveLength(0);
    expect(doc.selected).toBeNull();
  });

  it('moveWall snaps midpoint when snap is enabled', () => {
    const doc = new SceneDocument();
    const wall = doc.addWall({ start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });
    doc.patchSettings({ field: { snap: true, gridStep: 1 } });

    doc.moveWall(wall.id, 1.4, 0.6);

    expect(wall.midpoint.x).toBe(1);
    expect(wall.midpoint.z).toBe(1);
  });

  it('snapPoint prefers nearby wall endpoints', () => {
    const doc = new SceneDocument();
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    doc.patchSettings({ field: { snap: true, gridStep: 1 } });

    const snapped = doc.snapPoint({ x: 0.2, z: 0.1 });
    expect(snapped).toEqual({ x: 0, z: 0 });
  });

  it('fromSnapshot restores objects, walls, and settings round-trip', () => {
    const doc = new SceneDocument();
    const shape = doc.addShape('sphere', {
      position: { x: 2, z: -1 },
      surface: 'stone',
      color: '#112233',
    });
    const wall = doc.addWall({
      start: { x: 0, z: 0 },
      end: { x: 3, z: 0 },
      surface: 'fabric',
    });
    doc.patchSettings({ field: { snap: true, gridStep: 0.5 } });
    const snapshot = doc.toSnapshot();

    const restored = new SceneDocument();
    restored.fromSnapshot(snapshot);

    expect(restored.list()).toHaveLength(1);
    expect(restored.listWalls()).toHaveLength(1);
    expect(restored.get(shape.id)?.kind).toBe('sphere');
    expect(restored.get(shape.id)?.position.x).toBe(2);
    expect(restored.getWall(wall.id)?.end.x).toBe(3);
    expect(restored.getWall(wall.id)?.surface).toBe('fabric');
    expect(restored.settings.field.snap).toBe(true);
    expect(restored.settings.field.gridStep).toBe(0.5);
    expect(snapshot.walls).toHaveLength(1);
    expect(snapshot.rooms).toEqual([]);
  });

  it('detects a room from a closed square and preserves floor materials', () => {
    const doc = new SceneDocument();
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    doc.addWall({ start: { x: 4, z: 0 }, end: { x: 4, z: 4 } });
    doc.addWall({ start: { x: 4, z: 4 }, end: { x: 0, z: 4 } });
    doc.addWall({ start: { x: 0, z: 4 }, end: { x: 0, z: 0 } });

    expect(doc.listRooms()).toHaveLength(1);
    const room = doc.listRooms()[0]!;
    doc.setRoomFloorColor(room.id, '#aabbcc');
    doc.setRoomFloorSurface(room.id, 'wood');
    const fingerprint = room.fingerprint;
    const roomId = room.id;

    const snapshot = doc.toSnapshot();
    const restored = new SceneDocument();
    restored.fromSnapshot(snapshot);
    expect(restored.listRooms()).toHaveLength(1);
    expect(restored.listRooms()[0]!.id).toBe(roomId);
    expect(restored.listRooms()[0]!.fingerprint).toBe(fingerprint);
    expect(restored.listRooms()[0]!.floorColor).toBe('#aabbcc');
    expect(restored.listRooms()[0]!.floorSurface).toBe('wood');
  });

  it('recalculates rooms when a shared wall is deleted', () => {
    const doc = new SceneDocument();
    // Two adjacent rooms
    doc.addWall({ id: 'bottomL', start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });
    doc.addWall({ id: 'bottomR', start: { x: 2, z: 0 }, end: { x: 4, z: 0 } });
    doc.addWall({ id: 'right', start: { x: 4, z: 0 }, end: { x: 4, z: 2 } });
    doc.addWall({ id: 'topR', start: { x: 4, z: 2 }, end: { x: 2, z: 2 } });
    doc.addWall({ id: 'topL', start: { x: 2, z: 2 }, end: { x: 0, z: 2 } });
    doc.addWall({ id: 'left', start: { x: 0, z: 2 }, end: { x: 0, z: 0 } });
    doc.addWall({ id: 'shared', start: { x: 2, z: 0 }, end: { x: 2, z: 2 } });

    expect(doc.listRooms()).toHaveLength(2);
    doc.removeWall('shared');
    expect(doc.listRooms()).toHaveLength(1);
  });

  it('adds door and window on one wall, clamps width, and cascades on wall delete', () => {
    const doc = new SceneDocument();
    const wall = doc.addWall({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    const door = doc.addOpening(wall.id, 'door', { t: 0.3 });
    const window = doc.addOpening(wall.id, 'window', { t: 0.7 });
    expect(door).toBeTruthy();
    expect(window).toBeTruthy();
    expect(doc.listOpenings()).toHaveLength(2);

    const tooWide = doc.addOpening(wall.id, 'door', { width: 20, t: 0.5 });
    expect(tooWide!.width).toBeLessThanOrEqual(4);

    const snapshot = doc.toSnapshot();
    expect(snapshot.openings).toHaveLength(3);

    const restored = new SceneDocument();
    restored.fromSnapshot(snapshot);
    expect(restored.listOpenings()).toHaveLength(3);

    doc.removeWall(wall.id);
    expect(doc.listOpenings()).toHaveLength(0);
  });

  it('adds, moves, materials, duplicates, and removes furniture', () => {
    const doc = new SceneDocument();
    const chair = doc.addFurniture('chair', { position: { x: 1, z: 2 } });
    expect(doc.listFurniture()).toHaveLength(1);
    expect(doc.selected).toEqual({ type: 'furniture', id: chair.id });

    doc.moveFurniture(chair.id, 3, 4);
    expect(chair.position.x).toBe(3);
    expect(chair.position.z).toBe(4);

    doc.setFurnitureMaterial(chair.id, { surface: 'stone', color: '#abcdef' });
    doc.setFurnitureTransform(chair.id, { rotationY: Math.PI / 4, scale: 1.5 });
    expect(chair.surface).toBe('stone');
    expect(chair.color).toBe('#abcdef');
    expect(chair.rotationY).toBeCloseTo(Math.PI / 4);
    expect(chair.scale).toBe(1.5);

    const clone = doc.duplicateFurniture(chair.id);
    expect(clone).toBeTruthy();
    expect(doc.listFurniture()).toHaveLength(2);

    const snapshot = doc.toSnapshot();
    expect(snapshot.furniture).toHaveLength(2);
    const restored = new SceneDocument();
    restored.fromSnapshot(snapshot);
    expect(restored.listFurniture()).toHaveLength(2);
    expect(restored.getFurniture(chair.id)?.catalogId).toBe('chair');

    doc.removeSelected();
    expect(doc.listFurniture()).toHaveLength(1);
  });

  it('rejects stairs with the same floor as target', () => {
    const doc = new SceneDocument();
    expect(() =>
      doc.addStair({
        floorId: 'floor_1',
        targetFloorId: 'floor_1',
        position: { x: 0, z: 0 },
      }),
    ).toThrow(/targetFloorId must differ/);
  });

  it('round-trips stairs through snapshot', () => {
    const doc = new SceneDocument();
    const stair = doc.addStair({
      floorId: 'floor_1',
      targetFloorId: 'floor_2',
      position: { x: 1.5, z: -2 },
      width: 1.2,
      depth: 3,
      stepCount: 14,
      direction: 'up',
    });
    expect(doc.listStairs()).toHaveLength(1);
    expect(doc.selected).toEqual({ type: 'stair', id: stair.id });

    doc.moveStair(stair.id, 2, 3);
    doc.updateStair(stair.id, { direction: 'down', stepCount: 10 });

    const snapshot = doc.toSnapshot();
    expect(snapshot.stairs).toHaveLength(1);
    expect(snapshot.stairs[0]?.linkId).toBe(stair.linkId);
    expect(snapshot.stairs[0]?.targetFloorId).toBe('floor_2');

    const restored = new SceneDocument();
    restored.fromSnapshot(snapshot);
    expect(restored.listStairs()).toHaveLength(1);
    const loaded = restored.getStair(stair.id)!;
    expect(loaded.position).toEqual({ x: 2, z: 3 });
    expect(loaded.direction).toBe('down');
    expect(loaded.stepCount).toBe(10);
    expect(loaded.linkId).toBe(stair.linkId);
  });

  it('duplicates a wall offset from the source', () => {
    const doc = new SceneDocument();
    const wall = doc.addWall({ start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });
    const clone = doc.duplicateWall(wall.id);
    expect(clone).toBeTruthy();
    expect(doc.listWalls()).toHaveLength(2);
    expect(clone!.start).toEqual({ x: 1.2, z: 1.2 });
    expect(clone!.end).toEqual({ x: 3.2, z: 1.2 });
    expect(clone!.id).not.toBe(wall.id);
  });

  it('duplicates an opening along the same wall', () => {
    const doc = new SceneDocument();
    const wall = doc.addWall({ start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
    const opening = doc.addOpening(wall.id, 'door', { t: 0.4, width: 0.9 });
    expect(opening).toBeTruthy();
    const clone = doc.duplicateOpening(opening!.id);
    expect(clone).toBeTruthy();
    expect(doc.listOpenings()).toHaveLength(2);
    expect(clone!.wallId).toBe(wall.id);
    expect(clone!.t).toBeCloseTo(0.5);
  });
});
