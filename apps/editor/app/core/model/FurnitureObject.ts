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
  scale?: number;
  surface?: SurfaceKind;
  color?: string;
}

export interface FurnitureObjectSnapshot {
  id: string;
  catalogId: FurnitureCatalogId;
  position: Vector3Like;
  rotationY: number;
  scale: number;
  surface: SurfaceKind;
  color: string;
}

/**
 * Placeable furniture instance from the built-in catalog. Lives in a
 * dedicated document collection (not `ShapeKind`).
 */
export class FurnitureObject {
  public readonly id: string;
  public readonly catalogId: FurnitureCatalogId;
  public position: Vector3Like;
  public rotationY: number;
  public scale: number;
  public surface: SurfaceKind;
  public color: string;

  public constructor(init: FurnitureObjectInit) {
    const preset = getFurniturePreset(init.catalogId);
    this.id = init.id ?? createId('furniture');
    this.catalogId = init.catalogId;
    this.rotationY = init.rotationY ?? 0;
    this.scale = init.scale ?? 1;
    this.surface = init.surface ?? preset.defaultSurface;
    this.color = init.color ?? preset.defaultColor;
    this.position = { x: init.position?.x ?? 0, y: 0, z: init.position?.z ?? 0 };
    this.position.y = this.restingHeight;
  }

  public get height(): number {
    return getFurniturePreset(this.catalogId).height;
  }

  public get restingHeight(): number {
    return (this.height * this.scale) / 2;
  }

  public get footprint(): Footprint {
    const preset = getFurniturePreset(this.catalogId);
    return {
      width: preset.footprint.width * this.scale,
      depth: preset.footprint.depth * this.scale,
    };
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

  public setScale(scale: number): void {
    this.scale = Math.max(0.25, scale);
    this.position = { ...this.position, y: this.restingHeight };
  }

  public toSnapshot(): FurnitureObjectSnapshot {
    return {
      id: this.id,
      catalogId: this.catalogId,
      position: { ...this.position },
      rotationY: this.rotationY,
      scale: this.scale,
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
      scale: snapshot.scale,
      surface: snapshot.surface,
      color: snapshot.color,
    });
  }
}
