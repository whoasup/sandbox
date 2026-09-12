import { EventEmitter } from '@sandbox/ui-kit';
import { ShapeFactory } from './ShapeFactory';
import type { SceneObject } from './SceneObject';
import {
  cloneSceneSettings,
  createDefaultSceneSettings,
  mergeSceneSettings,
  roundToStep,
  type SceneSettings,
  type SceneSettingsPatch,
} from './SceneSettings';
import { Room, type RoomSnapshot } from './Room';
import { detectRooms } from './rooms/detectRooms';
import type { SceneObjectInit, SceneSnapshot, SelectionRef, ShapeKind, SurfaceKind } from './types';
import { WallObject, type Point2, type WallObjectInit } from './WallObject';

export type SceneDocumentChange = {
  objects: SceneObject[];
  walls: WallObject[];
  rooms: Room[];
};

// A type literal (not an `interface`) so it structurally satisfies the
// `EventMap` (`Record<string, unknown>`) constraint on `EventEmitter`.
export type SceneDocumentEvents = {
  change: SceneDocumentChange;
  select: SelectionRef;
  settings: SceneSettings;
};

/**
 * The single source of truth for the editor: shapes + walls + rooms,
 * document-level `SceneSettings`, plus a selection cursor that can point
 * at any entity type. Both the 2D (`SvgRenderer`) and 3D
 * (`ThreeRenderer`) views subscribe to the same document.
 */
export class SceneDocument extends EventEmitter<SceneDocumentEvents> {
  private readonly objects = new Map<string, SceneObject>();
  private readonly walls = new Map<string, WallObject>();
  private readonly rooms = new Map<string, Room>();
  private selection: SelectionRef = null;
  private sceneSettings: SceneSettings = createDefaultSceneSettings();

  public list(): SceneObject[] {
    return [...this.objects.values()];
  }

  public listWalls(): WallObject[] {
    return [...this.walls.values()];
  }

  public listRooms(): Room[] {
    return [...this.rooms.values()];
  }

  public get(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }

  public getWall(id: string): WallObject | undefined {
    return this.walls.get(id);
  }

  public getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  public get selected(): SelectionRef {
    return this.selection;
  }

  public get settings(): SceneSettings {
    return cloneSceneSettings(this.sceneSettings);
  }

  public addShape(kind: ShapeKind, init?: SceneObjectInit): SceneObject {
    const shape = ShapeFactory.create(kind, init);
    this.objects.set(shape.id, shape);
    this.select({ type: 'shape', id: shape.id });
    this.notifyChange();
    return shape;
  }

  public addWall(init?: WallObjectInit): WallObject {
    const wall = new WallObject(init);
    const { snap, gridStep } = this.sceneSettings.field;
    if (snap) {
      wall.setEndpoints(
        { x: roundToStep(wall.start.x, gridStep), z: roundToStep(wall.start.z, gridStep) },
        { x: roundToStep(wall.end.x, gridStep), z: roundToStep(wall.end.z, gridStep) },
      );
    }
    this.walls.set(wall.id, wall);
    this.select({ type: 'wall', id: wall.id });
    this.rebuildRooms();
    this.notifyChange();
    return wall;
  }

  public remove(id: string): void {
    if (!this.objects.delete(id)) return;
    if (this.selection?.type === 'shape' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public removeWall(id: string): void {
    if (!this.walls.delete(id)) return;
    if (this.selection?.type === 'wall' && this.selection.id === id) {
      this.select(null);
    }
    this.rebuildRooms();
    this.notifyChange();
  }

  public removeSelected(): void {
    if (!this.selection) return;
    if (this.selection.type === 'shape') this.remove(this.selection.id);
    else if (this.selection.type === 'wall') this.removeWall(this.selection.id);
    // Rooms are derived — clear selection only.
    else if (this.selection.type === 'room') this.select(null);
  }

  public select(next: SelectionRef): void {
    if (this.selection?.type === next?.type && this.selection?.id === next?.id) return;
    if (next?.type === 'shape' && !this.objects.has(next.id)) return;
    if (next?.type === 'wall' && !this.walls.has(next.id)) return;
    if (next?.type === 'room' && !this.rooms.has(next.id)) return;
    this.selection = next;
    this.emit('select', next);
  }

  public moveShape(id: string, x: number, z: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    const { snap, gridStep } = this.sceneSettings.field;
    const nextX = snap ? roundToStep(x, gridStep) : x;
    const nextZ = snap ? roundToStep(z, gridStep) : z;
    shape.moveTo(nextX, nextZ);
    this.notifyChange();
  }

  /**
   * Translate the wall so its midpoint follows `(x, z)` (floor plane).
   * When snap is on, the midpoint snaps to the grid.
   */
  public moveWall(id: string, x: number, z: number): void {
    const wall = this.walls.get(id);
    if (!wall) return;
    const { snap, gridStep } = this.sceneSettings.field;
    const targetX = snap ? roundToStep(x, gridStep) : x;
    const targetZ = snap ? roundToStep(z, gridStep) : z;
    const mid = wall.midpoint;
    wall.translate(targetX - mid.x, targetZ - mid.z);
    this.rebuildRooms();
    this.notifyChange();
  }

  public setWallHeight(id: string, height: number): void {
    const wall = this.walls.get(id);
    if (!wall) return;
    wall.setHeight(height);
    this.notifyChange();
  }

  public setWallThickness(id: string, thickness: number): void {
    const wall = this.walls.get(id);
    if (!wall) return;
    wall.setThickness(thickness);
    this.notifyChange();
  }

  public setWallSurface(id: string, surface: SurfaceKind): void {
    const wall = this.walls.get(id);
    if (!wall) return;
    wall.setSurface(surface);
    this.notifyChange();
  }

  public setWallColor(id: string, color: string): void {
    const wall = this.walls.get(id);
    if (!wall) return;
    wall.setColor(color);
    this.notifyChange();
  }

  public setRoomName(id: string, name: string): void {
    const room = this.rooms.get(id);
    if (!room) return;
    room.setName(name);
    this.notifyChange();
  }

  public setRoomFloorSurface(id: string, surface: SurfaceKind | undefined): void {
    const room = this.rooms.get(id);
    if (!room) return;
    room.setFloorSurface(surface);
    this.notifyChange();
  }

  public setRoomFloorColor(id: string, color: string): void {
    const room = this.rooms.get(id);
    if (!room) return;
    room.setFloorColor(color);
    this.notifyChange();
  }

  public setSurface(id: string, surface: SurfaceKind): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setSurface(surface);
    this.notifyChange();
  }

  public setColor(id: string, color: string): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setColor(color);
    this.notifyChange();
  }

  /**
   * Swap the concrete shape class while preserving id + transform +
   * material. Unsupported kinds throw (caller / UI must filter the catalog).
   */
  public replaceKind(id: string, kind: ShapeKind): SceneObject {
    if (!ShapeFactory.supports(kind)) {
      throw new Error(`SceneDocument.replaceKind: unsupported kind "${kind}"`);
    }
    const existing = this.objects.get(id);
    if (!existing) {
      throw new Error(`SceneDocument.replaceKind: unknown id "${id}"`);
    }
    if (existing.kind === kind) return existing;

    const snapshot = existing.toSnapshot();
    const replacement = ShapeFactory.create(kind, {
      id: snapshot.id,
      position: { x: snapshot.position.x, z: snapshot.position.z },
      rotationY: snapshot.rotationY,
      scale: snapshot.scale,
      surface: snapshot.surface,
      color: snapshot.color,
    });
    this.objects.set(id, replacement);
    this.select({ type: 'shape', id });
    this.notifyChange();
    return replacement;
  }

  public setRotationY(id: string, rotationY: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setRotationY(rotationY);
    this.notifyChange();
  }

  public setScale(id: string, scale: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setScale(scale);
    this.notifyChange();
  }

  public duplicate(id: string): SceneObject | null {
    const source = this.objects.get(id);
    if (!source) return null;
    const snap = source.toSnapshot();
    const clone = this.addShape(snap.kind, {
      position: { x: snap.position.x + 1.2, z: snap.position.z + 1.2 },
      rotationY: snap.rotationY,
      scale: snap.scale,
      surface: snap.surface,
      color: snap.color,
    });
    return clone;
  }

  public patchSettings(patch: SceneSettingsPatch): void {
    this.sceneSettings = mergeSceneSettings(this.sceneSettings, patch);
    this.emit('settings', this.settings);
  }

  public updateSettings(next: SceneSettings): void {
    this.sceneSettings = cloneSceneSettings(next);
    this.emit('settings', this.settings);
  }

  /** Snap a floor-plane point to the grid and/or nearest wall endpoint. */
  public snapPoint(point: Point2, endpointSnapRadius = 0.35): Point2 {
    const { snap, gridStep } = this.sceneSettings.field;
    let x = snap ? roundToStep(point.x, gridStep) : point.x;
    let z = snap ? roundToStep(point.z, gridStep) : point.z;

    let bestDist = endpointSnapRadius;
    for (const wall of this.walls.values()) {
      for (const endpoint of [wall.start, wall.end]) {
        const dist = Math.hypot(point.x - endpoint.x, point.z - endpoint.z);
        if (dist <= bestDist) {
          bestDist = dist;
          x = endpoint.x;
          z = endpoint.z;
        }
      }
    }
    return { x, z };
  }

  public toSnapshot(): SceneSnapshot {
    return {
      objects: this.list().map((object) => object.toSnapshot()),
      walls: this.listWalls().map((wall) => wall.toSnapshot()),
      rooms: this.listRooms().map((room) => room.toSnapshot()),
      settings: this.settings,
    };
  }

  /** Replace the document contents from a persisted / imported snapshot. */
  public fromSnapshot(snapshot: SceneSnapshot): void {
    this.objects.clear();
    this.walls.clear();
    this.rooms.clear();
    this.selection = null;

    for (const object of snapshot.objects) {
      if (!ShapeFactory.supports(object.kind)) {
        throw new Error(`SceneDocument.fromSnapshot: unsupported kind "${String(object.kind)}"`);
      }
      const shape = ShapeFactory.create(object.kind, {
        id: object.id,
        position: { x: object.position.x, z: object.position.z },
        rotationY: object.rotationY,
        scale: object.scale,
        surface: object.surface,
        color: object.color,
      });
      this.objects.set(shape.id, shape);
    }

    for (const wallSnap of snapshot.walls ?? []) {
      const wall = WallObject.fromSnapshot(wallSnap);
      this.walls.set(wall.id, wall);
    }

    this.sceneSettings = cloneSceneSettings(snapshot.settings ?? createDefaultSceneSettings());
    this.rebuildRooms(snapshot.rooms ?? []);
    this.emit('settings', this.settings);
    this.emit('select', null);
    this.notifyChange();
  }

  public clear(): void {
    this.objects.clear();
    this.walls.clear();
    this.rooms.clear();
    this.select(null);
    this.notifyChange();
  }

  /**
   * Recompute rooms from walls. Preserves floor materials when a draft's
   * polygon fingerprint matches a previous / stored room.
   */
  private rebuildRooms(
    preserve: readonly RoomSnapshot[] = this.listRooms().map((r) => r.toSnapshot()),
  ): void {
    const previousByFp = new Map<string, RoomSnapshot>();
    for (const snap of preserve) {
      previousByFp.set(snap.fingerprint, snap);
    }

    const drafts = detectRooms(this.listWalls());
    this.rooms.clear();

    let index = 1;
    for (const draft of drafts) {
      const prev = previousByFp.get(draft.fingerprint);
      const room = new Room({
        id: prev?.id,
        name: prev?.name ?? `Комната ${index}`,
        polygon: draft.polygon,
        wallIds: draft.wallIds,
        fingerprint: draft.fingerprint,
        floorColor: prev?.floorColor,
        floorSurface: prev?.floorSurface,
      });
      this.rooms.set(room.id, room);
      index += 1;
    }

    if (this.selection?.type === 'room' && !this.rooms.has(this.selection.id)) {
      this.selection = null;
      this.emit('select', null);
    }
  }

  private notifyChange(): void {
    this.emit('change', {
      objects: this.list(),
      walls: this.listWalls(),
      rooms: this.listRooms(),
    });
  }
}
