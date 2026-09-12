import { createId, type SurfaceKind } from '@sandbox/ui-kit';

export interface Point2 {
  x: number;
  z: number;
}

export interface WallObjectInit {
  id?: string;
  start?: Point2;
  end?: Point2;
  height?: number;
  thickness?: number;
  surface?: SurfaceKind;
  color?: string;
}

export interface WallObjectSnapshot {
  id: string;
  start: Point2;
  end: Point2;
  height: number;
  thickness: number;
  surface: SurfaceKind;
  color: string;
}

const DEFAULT_HEIGHT = 2.5;
const DEFAULT_THICKNESS = 0.2;

/** First-class wall segment (not a `ShapeKind` primitive). */
export class WallObject {
  public readonly id: string;
  public start: Point2;
  public end: Point2;
  public height: number;
  public thickness: number;
  public surface: SurfaceKind;
  public color: string;

  public constructor(init: WallObjectInit = {}) {
    this.id = init.id ?? createId('wall');
    this.start = { x: init.start?.x ?? 0, z: init.start?.z ?? 0 };
    this.end = { x: init.end?.x ?? 1, z: init.end?.z ?? 0 };
    this.height = init.height ?? DEFAULT_HEIGHT;
    this.thickness = init.thickness ?? DEFAULT_THICKNESS;
    this.surface = init.surface ?? 'stone';
    this.color = init.color ?? '#d8d2c8';
  }

  public get length(): number {
    const dx = this.end.x - this.start.x;
    const dz = this.end.z - this.start.z;
    return Math.hypot(dx, dz);
  }

  public get angleY(): number {
    return Math.atan2(this.end.x - this.start.x, this.end.z - this.start.z);
  }

  public get midpoint(): Point2 {
    return {
      x: (this.start.x + this.end.x) / 2,
      z: (this.start.z + this.end.z) / 2,
    };
  }

  public setEndpoints(start: Point2, end: Point2): void {
    this.start = { ...start };
    this.end = { ...end };
  }

  public translate(dx: number, dz: number): void {
    this.start = { x: this.start.x + dx, z: this.start.z + dz };
    this.end = { x: this.end.x + dx, z: this.end.z + dz };
  }

  public setHeight(height: number): void {
    this.height = Math.max(0.5, height);
  }

  public setThickness(thickness: number): void {
    this.thickness = Math.max(0.05, thickness);
  }

  public setSurface(surface: SurfaceKind): void {
    this.surface = surface;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public toSnapshot(): WallObjectSnapshot {
    return {
      id: this.id,
      start: { ...this.start },
      end: { ...this.end },
      height: this.height,
      thickness: this.thickness,
      surface: this.surface,
      color: this.color,
    };
  }

  public static fromSnapshot(snapshot: WallObjectSnapshot): WallObject {
    return new WallObject(snapshot);
  }

  /**
   * Distance from a floor-plane point to the wall centerline, used for
   * 2D hit-testing (with a thickness-based threshold).
   */
  public distanceToPoint(point: Point2): number {
    const ax = this.start.x;
    const az = this.start.z;
    const bx = this.end.x;
    const bz = this.end.z;
    const abx = bx - ax;
    const abz = bz - az;
    const lengthSq = abx * abx + abz * abz;
    if (lengthSq < 1e-8) {
      return Math.hypot(point.x - ax, point.z - az);
    }
    const t = Math.max(0, Math.min(1, ((point.x - ax) * abx + (point.z - az) * abz) / lengthSq));
    const cx = ax + abx * t;
    const cz = az + abz * t;
    return Math.hypot(point.x - cx, point.z - cz);
  }

  public hits(point: Point2, padding = 0.15): boolean {
    return this.distanceToPoint(point) <= this.thickness / 2 + padding;
  }
}
