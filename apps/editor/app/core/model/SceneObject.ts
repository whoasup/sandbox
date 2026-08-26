import { createId } from '@sandbox/ui-kit';
import { SHAPE_DIMENSIONS, type ShapeDimensions } from './shapeDimensions';
import type { Footprint, SceneObjectInit, SceneObjectSnapshot, ShapeKind, SurfaceKind, Vector3Like } from './types';

/**
 * Base class for every placeable primitive in the document. Concrete
 * shapes (`CubeObject`, `SphereObject`, ...) only need to declare their
 * `kind` — position/rotation/surface bookkeeping and the resting-on-floor
 * math live here once.
 */
export abstract class SceneObject {
  public readonly id: string;
  public readonly kind: ShapeKind;

  public position: Vector3Like;
  public rotationY: number;
  public scale: number;
  public surface: SurfaceKind;
  public color: string;

  /**
   * `kind` is taken as a constructor parameter rather than a subclass
   * field so it is available immediately — subclass field initializers
   * only run *after* this base constructor returns, which would make
   * `this.kind` (and therefore `this.dimensions`/`restingHeight`) undefined
   * while this constructor body is still executing.
   */
  protected constructor(kind: ShapeKind, init: SceneObjectInit = {}) {
    this.kind = kind;
    this.id = init.id ?? createId('shape');
    this.rotationY = init.rotationY ?? 0;
    this.scale = init.scale ?? 1;
    this.surface = init.surface ?? 'wood';
    this.color = init.color ?? '#c9945f';
    this.position = { x: init.position?.x ?? 0, y: 0, z: init.position?.z ?? 0 };
    this.position.y = this.restingHeight;
  }

  public get dimensions(): ShapeDimensions {
    return SHAPE_DIMENSIONS[this.kind];
  }

  /** Y offset that keeps the shape sitting on the floor plane. */
  public get restingHeight(): number {
    return (this.dimensions.height * this.scale) / 2;
  }

  /** Axis-aligned footprint on the floor plane, used by the 2D top-down view. */
  public get footprint(): Footprint {
    return {
      width: this.dimensions.width * this.scale,
      depth: this.dimensions.depth * this.scale,
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

  public toSnapshot(): SceneObjectSnapshot {
    return {
      id: this.id,
      kind: this.kind,
      position: { ...this.position },
      rotationY: this.rotationY,
      scale: this.scale,
      surface: this.surface,
      color: this.color,
    };
  }
}
