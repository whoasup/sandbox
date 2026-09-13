import {
  createId,
  getFurniturePreset,
  type FurnitureCatalogId,
  type SurfaceKind,
} from '@sandbox/ui-kit';
import type { Footprint, Vector3Like } from './types';

export interface FurnitureObjectInit {
  id?: string;
  catalogId: FurnitureCatalogId;
  position?: Partial<Pick<Vector3Like, 'x' | 'z'>>;
  rotationY?: number;
  /** Legacy uniform scale; used only when width/depth/height are omitted. */
  scale?: number;
  width?: number;
  depth?: number;
  height?: number;
  surface?: SurfaceKind;
  color?: string;
}

export interface FurnitureObjectSnapshot {
  id: string;
  catalogId: FurnitureCatalogId;
  position: Vector3Like;
  rotationY: number;
  /** Average of size ratios vs preset — kept for backward-compatible readers. */
  scale: number;
  width: number;
  depth: number;
  height: number;
  surface: SurfaceKind;
  color: string;
}

export interface FurnitureSizePatch {
  width?: number;
  depth?: number;
  height?: number;
}

const MIN_SIZE = 0.01;

/**
 * Placeable furniture instance from the built-in catalog. Lives in a
 * dedicated document collection (not `ShapeKind`).
 */
export class FurnitureObject {
  public readonly id: string;
  public readonly catalogId: FurnitureCatalogId;
  public position: Vector3Like;
  public rotationY: number;
  public width: number;
  public depth: number;
  public height: number;
  public surface: SurfaceKind;
  public color: string;

  public constructor(init: FurnitureObjectInit) {
    const preset = getFurniturePreset(init.catalogId);
    const legacyScale = init.scale !== undefined && init.scale > 0 ? init.scale : 1;
    this.id = init.id ?? createId('furniture');
    this.catalogId = init.catalogId;
    this.rotationY = init.rotationY ?? 0;
    this.width = Math.max(MIN_SIZE, init.width ?? preset.footprint.width * legacyScale);
    this.depth = Math.max(MIN_SIZE, init.depth ?? preset.footprint.depth * legacyScale);
    this.height = Math.max(MIN_SIZE, init.height ?? preset.height * legacyScale);
    this.surface = init.surface ?? preset.defaultSurface;
    this.color = init.color ?? preset.defaultColor;
    this.position = { x: init.position?.x ?? 0, y: 0, z: init.position?.z ?? 0 };
    this.position.y = this.restingHeight;
  }

  /** Average of size ratios vs preset dims (compat for uniform-scale call sites). */
  public get scale(): number {
    const preset = getFurniturePreset(this.catalogId);
    const sx = this.width / preset.footprint.width;
    const sz = this.depth / preset.footprint.depth;
    const sy = this.height / preset.height;
    return (sx + sy + sz) / 3;
  }

  public get restingHeight(): number {
    return this.height / 2;
  }

  public get footprint(): Footprint {
    return { width: this.width, depth: this.depth };
  }

  public moveTo(x: number, z: number): void {
    this.position = { x, y: this.restingHeight, z };
  }

  public setSurface(surface: SurfaceKind): void {
    this.surface = surface;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public setRotationY(rotationY: number): void {
    this.rotationY = rotationY;
  }

  /** Scale all three dimensions proportionally from current sizes. */
  public setScale(scale: number): void {
    const factor = Math.max(0.25, scale) / Math.max(this.scale, 1e-6);
    this.width = Math.max(MIN_SIZE, this.width * factor);
    this.depth = Math.max(MIN_SIZE, this.depth * factor);
    this.height = Math.max(MIN_SIZE, this.height * factor);
    this.position = { ...this.position, y: this.restingHeight };
  }

  public setSize(patch: FurnitureSizePatch): void {
    if (patch.width !== undefined) this.width = Math.max(MIN_SIZE, patch.width);
    if (patch.depth !== undefined) this.depth = Math.max(MIN_SIZE, patch.depth);
    if (patch.height !== undefined) this.height = Math.max(MIN_SIZE, patch.height);
    this.position = { ...this.position, y: this.restingHeight };
  }

  public toSnapshot(): FurnitureObjectSnapshot {
    return {
      id: this.id,
      catalogId: this.catalogId,
      position: { ...this.position },
      rotationY: this.rotationY,
      scale: this.scale,
      width: this.width,
      depth: this.depth,
      height: this.height,
      surface: this.surface,
      color: this.color,
    };
  }

  public static fromSnapshot(snapshot: FurnitureObjectSnapshot): FurnitureObject {
    return new FurnitureObject({
      id: snapshot.id,
      catalogId: snapshot.catalogId,
      position: { x: snapshot.position.x, z: snapshot.position.z },
      rotationY: snapshot.rotationY,
      width: snapshot.width,
      depth: snapshot.depth,
      height: snapshot.height,
      scale: snapshot.scale,
      surface: snapshot.surface,
      color: snapshot.color,
    });
  }
}
