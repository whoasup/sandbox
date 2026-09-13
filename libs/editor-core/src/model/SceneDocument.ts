import { EventEmitter, type FurnitureCatalogId } from '@sandbox/ui-kit';
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
import { FurnitureObject, type FurnitureObjectInit } from './FurnitureObject';
import { Opening, type OpeningInit, type OpeningType } from './Opening';
import { Room, type RoomSnapshot } from './Room';
import { detectRooms } from './rooms/detectRooms';
import { snapPointPipeline } from '../snap/snapPoint';
import { assertValidStairTarget, StairObject, type StairObjectInit } from './StairObject';
import { DimensionLine, type DimensionLineInit } from './DimensionLine';
import type { SceneObjectInit, SceneSnapshot, SelectionRef, ShapeKind, SurfaceKind } from './types';
import { WallObject, type Point2, type WallObjectInit } from './WallObject';

export type SceneDocumentChange = {
  objects: SceneObject[];
  walls: WallObject[];
  rooms: Room[];
  openings: Opening[];
  furniture: FurnitureObject[];
  stairs: StairObject[];
  dimensions: DimensionLine[];
};

// A type literal (not an `interface`) so it structurally satisfies the
// `EventMap` (`Record<string, unknown>`) constraint on `EventEmitter`.
export type SceneDocumentEvents = {
  change: SceneDocumentChange;
  select: SelectionRef;
  settings: SceneSettings;
};

/**
 * The single source of truth for the editor: shapes + walls + rooms +
 * openings + furniture + stairs + dimensions, document-level `SceneSettings`,
 * plus a selection cursor.
 */
export class SceneDocument extends EventEmitter<SceneDocumentEvents> {
  private readonly objects = new Map<string, SceneObject>();
  private readonly walls = new Map<string, WallObject>();
  private readonly rooms = new Map<string, Room>();
  private readonly openings = new Map<string, Opening>();
  private readonly furniture = new Map<string, FurnitureObject>();
  private readonly stairs = new Map<string, StairObject>();
  private readonly dimensions = new Map<string, DimensionLine>();
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

  public listOpenings(): Opening[] {
    return [...this.openings.values()];
  }

  public listFurniture(): FurnitureObject[] {
    return [...this.furniture.values()];
  }

  public listStairs(): StairObject[] {
    return [...this.stairs.values()];
  }

  public listDimensions(): DimensionLine[] {
    return [...this.dimensions.values()];
  }

  public listOpeningsForWall(wallId: string): Opening[] {
    return this.listOpenings().filter((o) => o.wallId === wallId);
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

  public getOpening(id: string): Opening | undefined {
    return this.openings.get(id);
  }

  public getFurniture(id: string): FurnitureObject | undefined {
    return this.furniture.get(id);
  }

  public getStair(id: string): StairObject | undefined {
    return this.stairs.get(id);
  }

  public getDimension(id: string): DimensionLine | undefined {
    return this.dimensions.get(id);
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

  public addFurniture(
    catalogId: FurnitureCatalogId,
    init?: Omit<FurnitureObjectInit, 'catalogId'>,
  ): FurnitureObject {
    const item = new FurnitureObject({ catalogId, ...init });
    const { snap, gridStep } = this.sceneSettings.field;
    if (snap) {
      item.moveTo(roundToStep(item.position.x, gridStep), roundToStep(item.position.z, gridStep));
    }
    this.furniture.set(item.id, item);
    this.select({ type: 'furniture', id: item.id });
    this.notifyChange();
    return item;
  }

  public remove(id: string): void {
    if (!this.objects.delete(id)) return;
    if (this.selection?.type === 'shape' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public removeFurniture(id: string): void {
    if (!this.furniture.delete(id)) return;
    if (this.selection?.type === 'furniture' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public addStair(init: StairObjectInit): StairObject {
    assertValidStairTarget(init.floorId, init.targetFloorId);
    const stair = new StairObject(init);
    const { snap, gridStep } = this.sceneSettings.field;
    if (snap) {
      stair.moveTo(
        roundToStep(stair.position.x, gridStep),
        roundToStep(stair.position.z, gridStep),
      );
    }
    this.stairs.set(stair.id, stair);
    this.select({ type: 'stair', id: stair.id });
    this.notifyChange();
    return stair;
  }

  public removeStair(id: string): void {
    if (!this.stairs.delete(id)) return;
    if (this.selection?.type === 'stair' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public removeStairsByLinkId(linkId: string): void {
    let removed = false;
    for (const stair of [...this.stairs.values()]) {
      if (stair.linkId !== linkId) continue;
      this.stairs.delete(stair.id);
      removed = true;
      if (this.selection?.type === 'stair' && this.selection.id === stair.id) {
        this.select(null);
      }
    }
    if (removed) this.notifyChange();
  }

  public updateStair(
    id: string,
    patch: Partial<
      Pick<
        StairObject,
        'targetFloorId' | 'position' | 'rotationY' | 'width' | 'depth' | 'stepCount' | 'direction'
      >
    >,
  ): void {
    const stair = this.stairs.get(id);
    if (!stair) return;
    if (patch.targetFloorId !== undefined) {
      assertValidStairTarget(stair.floorId, patch.targetFloorId);
      stair.targetFloorId = patch.targetFloorId;
    }
    if (patch.position) stair.moveTo(patch.position.x, patch.position.z);
    if (patch.rotationY !== undefined) stair.rotationY = patch.rotationY;
    if (patch.width !== undefined) stair.width = Math.max(0.4, patch.width);
    if (patch.depth !== undefined) stair.depth = Math.max(0.8, patch.depth);
    if (patch.stepCount !== undefined) stair.stepCount = Math.max(3, Math.round(patch.stepCount));
    if (patch.direction !== undefined) stair.direction = patch.direction;
    this.notifyChange();
  }

  public addDimension(init: DimensionLineInit): DimensionLine {
    const dim = new DimensionLine(init);
    this.dimensions.set(dim.id, dim);
    this.select({ type: 'dimension', id: dim.id });
    this.notifyChange();
    return dim;
  }

  public removeDimension(id: string): void {
    if (!this.dimensions.delete(id)) return;
    if (this.selection?.type === 'dimension' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public updateDimension(
    id: string,
    patch: Partial<Pick<DimensionLine, 'start' | 'end' | 'offset'>>,
  ): void {
    const dim = this.dimensions.get(id);
    if (!dim) return;
    if (patch.start) dim.start = { ...patch.start };
    if (patch.end) dim.end = { ...patch.end };
    if (patch.offset !== undefined) dim.offset = patch.offset;
    this.notifyChange();
  }

  public moveStair(id: string, x: number, z: number): void {
    const stair = this.stairs.get(id);
    if (!stair) return;
    const { snap, gridStep } = this.sceneSettings.field;
    const nextX = snap ? roundToStep(x, gridStep) : x;
    const nextZ = snap ? roundToStep(z, gridStep) : z;
    stair.moveTo(nextX, nextZ);
    this.notifyChange();
  }

  public removeWall(id: string): void {
    if (!this.walls.delete(id)) return;
    for (const opening of [...this.openings.values()]) {
      if (opening.wallId === id) this.openings.delete(opening.id);
    }
    if (this.selection?.type === 'wall' && this.selection.id === id) {
      this.select(null);
    } else if (this.selection?.type === 'opening' && !this.openings.has(this.selection.id)) {
      this.select(null);
    }
    this.rebuildRooms();
    this.notifyChange();
  }

  public removeSelected(): void {
    if (!this.selection) return;
    if (this.selection.type === 'shape') this.remove(this.selection.id);
    else if (this.selection.type === 'wall') this.removeWall(this.selection.id);
    else if (this.selection.type === 'opening') this.removeOpening(this.selection.id);
    else if (this.selection.type === 'furniture') this.removeFurniture(this.selection.id);
    else if (this.selection.type === 'stair') this.removeStair(this.selection.id);
    else if (this.selection.type === 'dimension') this.removeDimension(this.selection.id);
    else if (this.selection.type === 'room') this.select(null);
  }

  public select(next: SelectionRef): void {
    if (this.selection?.type === next?.type && this.selection?.id === next?.id) return;
    if (next?.type === 'shape' && !this.objects.has(next.id)) return;
    if (next?.type === 'wall' && !this.walls.has(next.id)) return;
    if (next?.type === 'room' && !this.rooms.has(next.id)) return;
    if (next?.type === 'opening' && !this.openings.has(next.id)) return;
    if (next?.type === 'furniture' && !this.furniture.has(next.id)) return;
    if (next?.type === 'stair' && !this.stairs.has(next.id)) return;
    if (next?.type === 'dimension' && !this.dimensions.has(next.id)) return;
    this.selection = next;
    this.emit('select', next);
  }

  public addOpening(
    wallId: string,
    type: OpeningType,
    init?: Partial<Omit<OpeningInit, 'wallId' | 'type'>>,
  ): Opening | null {
    const wall = this.walls.get(wallId);
    if (!wall) return null;
    const opening = new Opening({ wallId, type, ...init });
    opening.applyClamp(wall.length);
    // Also clamp height to wall
    opening.height = Math.min(opening.height, Math.max(0.3, wall.height - opening.sill));
    this.openings.set(opening.id, opening);
    this.select({ type: 'opening', id: opening.id });
    this.notifyChange();
    return opening;
  }

  public removeOpening(id: string): void {
    if (!this.openings.delete(id)) return;
    if (this.selection?.type === 'opening' && this.selection.id === id) {
      this.select(null);
    }
    this.notifyChange();
  }

  public moveOpening(id: string, t: number): void {
    const opening = this.openings.get(id);
    if (!opening) return;
    const wall = this.walls.get(opening.wallId);
    if (!wall) return;
    opening.t = t;
    opening.applyClamp(wall.length);
    this.notifyChange();
  }

  public updateOpening(
    id: string,
    patch: Partial<Pick<Opening, 'type' | 't' | 'width' | 'height' | 'sill'>>,
  ): void {
    const opening = this.openings.get(id);
    if (!opening) return;
    const wall = this.walls.get(opening.wallId);
    if (!wall) return;
    if (patch.type !== undefined) opening.type = patch.type;
    if (patch.t !== undefined) opening.t = patch.t;
    if (patch.width !== undefined) opening.width = patch.width;
    if (patch.height !== undefined) opening.height = patch.height;
    if (patch.sill !== undefined) opening.sill = patch.sill;
    opening.applyClamp(wall.length);
    opening.height = Math.min(opening.height, Math.max(0.3, wall.height - opening.sill));
    this.notifyChange();
  }

  /**
   * Place an opening on the wall nearest to `point` (or a given wall),
   * using the parametric `t` along that wall.
   */
  public addOpeningAtPoint(type: OpeningType, point: Point2, wallId?: string): Opening | null {
    let wall = wallId ? this.walls.get(wallId) : undefined;
    if (!wall) {
      let best: WallObject | undefined;
      let bestDist = Infinity;
      for (const candidate of this.walls.values()) {
        const d = candidate.distanceToPoint(point);
        if (d < bestDist) {
          bestDist = d;
          best = candidate;
        }
      }
      wall = best;
    }
    if (!wall || wall.length < 0.2) return null;
    const ax = wall.start.x;
    const az = wall.start.z;
    const bx = wall.end.x;
    const bz = wall.end.z;
    const abx = bx - ax;
    const abz = bz - az;
    const lengthSq = abx * abx + abz * abz;
    const t = lengthSq < 1e-8 ? 0.5 : ((point.x - ax) * abx + (point.z - az) * abz) / lengthSq;
    return this.addOpening(wall.id, type, { t });
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

  public moveFurniture(id: string, x: number, z: number): void {
    const item = this.furniture.get(id);
    if (!item) return;
    const { snap, gridStep } = this.sceneSettings.field;
    const nextX = snap ? roundToStep(x, gridStep) : x;
    const nextZ = snap ? roundToStep(z, gridStep) : z;
    item.moveTo(nextX, nextZ);
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
    for (const opening of this.listOpeningsForWall(id)) {
      opening.applyClamp(wall.length);
    }
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

  public setFurnitureTransform(
    id: string,
    patch: Partial<Pick<FurnitureObject, 'rotationY' | 'scale' | 'width' | 'depth' | 'height'>>,
  ): void {
    const item = this.furniture.get(id);
    if (!item) return;
    if (patch.rotationY !== undefined) item.setRotationY(patch.rotationY);
    if (patch.width !== undefined || patch.depth !== undefined || patch.height !== undefined) {
      item.setSize({
        width: patch.width,
        depth: patch.depth,
        height: patch.height,
      });
    }
    if (patch.scale !== undefined) item.setScale(patch.scale);
    this.notifyChange();
  }

  public setFurnitureMaterial(
    id: string,
    patch: Partial<Pick<FurnitureObject, 'surface' | 'color'>>,
  ): void {
    const item = this.furniture.get(id);
    if (!item) return;
    if (patch.surface !== undefined) item.setSurface(patch.surface);
    if (patch.color !== undefined) item.setColor(patch.color);
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

  public duplicateFurniture(id: string): FurnitureObject | null {
    const source = this.furniture.get(id);
    if (!source) return null;
    const snap = source.toSnapshot();
    return this.addFurniture(snap.catalogId, {
      position: { x: snap.position.x + 1.2, z: snap.position.z + 1.2 },
      rotationY: snap.rotationY,
      width: snap.width,
      depth: snap.depth,
      height: snap.height,
      surface: snap.surface,
      color: snap.color,
    });
  }

  public duplicateWall(id: string): WallObject | null {
    const source = this.walls.get(id);
    if (!source) return null;
    const snap = source.toSnapshot();
    return this.addWall({
      start: { x: snap.start.x + 1.2, z: snap.start.z + 1.2 },
      end: { x: snap.end.x + 1.2, z: snap.end.z + 1.2 },
      height: snap.height,
      thickness: snap.thickness,
      surface: snap.surface,
      color: snap.color,
    });
  }

  public duplicateOpening(id: string): Opening | null {
    const source = this.openings.get(id);
    if (!source) return null;
    const snap = source.toSnapshot();
    if (!this.walls.get(snap.wallId)) return null;
    return this.addOpening(snap.wallId, snap.type, {
      t: Math.min(0.9, snap.t + 0.1),
      width: snap.width,
      height: snap.height,
      sill: snap.sill,
    });
  }

  public patchSettings(patch: SceneSettingsPatch): void {
    this.sceneSettings = mergeSceneSettings(this.sceneSettings, patch);
    this.emit('settings', this.settings);
  }

  public updateSettings(next: SceneSettings): void {
    this.sceneSettings = cloneSceneSettings(next);
    this.emit('settings', this.settings);
  }

  /** Snap a floor-plane point: grid → endpoints → optional 45° from `angleFrom`. */
  public snapPoint(point: Point2, endpointSnapRadius = 0.35, angleFrom?: Point2 | null): Point2 {
    const { snap, gridStep } = this.sceneSettings.field;
    return snapPointPipeline(point, this.listWalls(), {
      snapEnabled: snap,
      gridStep,
      endpointRadius: endpointSnapRadius,
      angleFrom: angleFrom ?? null,
    });
  }

  public toSnapshot(): SceneSnapshot {
    return {
      objects: this.list().map((object) => object.toSnapshot()),
      walls: this.listWalls().map((wall) => wall.toSnapshot()),
      rooms: this.listRooms().map((room) => room.toSnapshot()),
      openings: this.listOpenings().map((opening) => opening.toSnapshot()),
      furniture: this.listFurniture().map((item) => item.toSnapshot()),
      stairs: this.listStairs().map((stair) => stair.toSnapshot()),
      dimensions: this.listDimensions().map((dim) => dim.toSnapshot()),
      settings: this.settings,
    };
  }

  /** Replace the document contents from a persisted / imported snapshot. */
  public fromSnapshot(snapshot: SceneSnapshot): void {
    this.objects.clear();
    this.walls.clear();
    this.rooms.clear();
    this.openings.clear();
    this.furniture.clear();
    this.stairs.clear();
    this.dimensions.clear();
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

    for (const openingSnap of snapshot.openings ?? []) {
      if (!this.walls.has(openingSnap.wallId)) continue;
      const opening = Opening.fromSnapshot(openingSnap);
      const wall = this.walls.get(opening.wallId)!;
      opening.applyClamp(wall.length);
      this.openings.set(opening.id, opening);
    }

    for (const furnitureSnap of snapshot.furniture ?? []) {
      const item = FurnitureObject.fromSnapshot(furnitureSnap);
      this.furniture.set(item.id, item);
    }

    for (const stairSnap of snapshot.stairs ?? []) {
      try {
        assertValidStairTarget(stairSnap.floorId, stairSnap.targetFloorId);
        const stair = StairObject.fromSnapshot(stairSnap);
        this.stairs.set(stair.id, stair);
      } catch {
        // Skip invalid stairs from corrupt snapshots.
      }
    }

    for (const dimSnap of snapshot.dimensions ?? []) {
      const dim = DimensionLine.fromSnapshot(dimSnap);
      this.dimensions.set(dim.id, dim);
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
    this.openings.clear();
    this.furniture.clear();
    this.stairs.clear();
    this.dimensions.clear();
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
      openings: this.listOpenings(),
      furniture: this.listFurniture(),
      stairs: this.listStairs(),
      dimensions: this.listDimensions(),
    });
  }
}
