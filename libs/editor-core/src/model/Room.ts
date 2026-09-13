import { createId, type SurfaceKind } from '@sandbox/ui-kit';
import type { Point2 } from './WallObject';

export interface RoomInit {
  id?: string;
  name?: string;
  polygon: Point2[];
  floorSurface?: SurfaceKind;
  floorColor?: string;
  wallIds?: string[];
  fingerprint?: string;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  polygon: Point2[];
  floorSurface?: SurfaceKind;
  floorColor: string;
  wallIds: string[];
  fingerprint: string;
}

/** Draft produced by contour detection before materialisation. */
export interface RoomDraft {
  polygon: Point2[];
  wallIds: string[];
  fingerprint: string;
  /** Signed area; positive = CCW winding in XZ. */
  signedArea: number;
}

const DEFAULT_FLOOR_COLOR = '#c8b89a';

/**
 * A closed wall loop with an editable floor. Polygon vertices are ordered
 * CCW in the XZ floor plane (positive Y up in 3D).
 */
export class Room {
  public readonly id: string;
  public name: string;
  public polygon: Point2[];
  public floorSurface?: SurfaceKind;
  public floorColor: string;
  public wallIds: string[];
  public fingerprint: string;

  public constructor(init: RoomInit) {
    this.id = init.id ?? createId('room');
    this.name = init.name ?? 'Комната';
    this.polygon = init.polygon.map((p) => ({ x: p.x, z: p.z }));
    this.floorSurface = init.floorSurface;
    this.floorColor = init.floorColor ?? DEFAULT_FLOOR_COLOR;
    this.wallIds = [...(init.wallIds ?? [])];
    this.fingerprint = init.fingerprint ?? fingerprintPolygon(this.polygon);
  }

  public setName(name: string): void {
    this.name = name.trim() || 'Комната';
  }

  public setFloorSurface(surface: SurfaceKind | undefined): void {
    this.floorSurface = surface;
  }

  public setFloorColor(color: string): void {
    this.floorColor = color;
  }

  /** Absolute floor area in m² (XZ plane). */
  public get areaM2(): number {
    return Math.abs(polygonSignedArea(this.polygon));
  }

  /** Centroid of the polygon in the XZ plane (for labels). */
  public get centroid(): Point2 {
    if (this.polygon.length === 0) return { x: 0, z: 0 };
    let sx = 0;
    let sz = 0;
    for (const p of this.polygon) {
      sx += p.x;
      sz += p.z;
    }
    return { x: sx / this.polygon.length, z: sz / this.polygon.length };
  }

  public toSnapshot(): RoomSnapshot {
    return {
      id: this.id,
      name: this.name,
      polygon: this.polygon.map((p) => ({ x: p.x, z: p.z })),
      floorSurface: this.floorSurface,
      floorColor: this.floorColor,
      wallIds: [...this.wallIds],
      fingerprint: this.fingerprint,
    };
  }

  public static fromSnapshot(snapshot: RoomSnapshot): Room {
    return new Room(snapshot);
  }
}

/** Stable fingerprint of a polygon for material preservation across rebuilds. */
export function fingerprintPolygon(polygon: Point2[], precision = 3): string {
  if (polygon.length === 0) return '';
  const factor = 10 ** precision;
  const rounded = polygon.map((p) => ({
    x: Math.round(p.x * factor) / factor,
    z: Math.round(p.z * factor) / factor,
  }));
  // Rotate so the lexicographically smallest vertex is first.
  let minIdx = 0;
  for (let i = 1; i < rounded.length; i++) {
    const a = rounded[i]!;
    const b = rounded[minIdx]!;
    if (a.x < b.x || (a.x === b.x && a.z < b.z)) minIdx = i;
  }
  const rotated = [...rounded.slice(minIdx), ...rounded.slice(0, minIdx)];
  // Prefer the direction that yields the smaller string (CW vs CCW).
  const forward = rotated.map((p) => `${p.x},${p.z}`).join(';');
  const reversed = [rotated[0]!, ...rotated.slice(1).reverse()]
    .map((p) => `${p.x},${p.z}`)
    .join(';');
  return forward <= reversed ? forward : reversed;
}

export function polygonSignedArea(polygon: Point2[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    area += a.x * b.z - b.x * a.z;
  }
  return area / 2;
}

/** Point-in-polygon (ray cast) for XZ floor plane. */
export function pointInPolygon(point: Point2, polygon: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    const intersects =
      pi.z > point.z !== pj.z > point.z &&
      point.x < ((pj.x - pi.x) * (point.z - pi.z)) / (pj.z - pi.z + 1e-12) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}
