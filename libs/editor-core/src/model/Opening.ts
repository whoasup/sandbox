import { createId } from '@sandbox/ui-kit';

export type OpeningType = 'door' | 'window';

export interface OpeningInit {
  id?: string;
  wallId: string;
  type: OpeningType;
  /** Normalized position along wall centerline, 0..1 */
  t?: number;
  width?: number;
  height?: number;
  /** Window sill height from floor; doors typically 0 */
  sill?: number;
}

export interface OpeningSnapshot {
  id: string;
  wallId: string;
  type: OpeningType;
  t: number;
  width: number;
  height: number;
  sill: number;
}

const DOOR_DEFAULTS = { width: 0.9, height: 2.1, sill: 0, t: 0.5 };
const WINDOW_DEFAULTS = { width: 1.2, height: 1.2, sill: 0.9, t: 0.5 };

export function defaultsForOpeningType(type: OpeningType) {
  return type === 'door' ? { ...DOOR_DEFAULTS } : { ...WINDOW_DEFAULTS };
}

/**
 * Clamp width and `t` so the opening footprint stays inside the wall
 * length (with a tiny margin).
 */
export function clampOpeningToWall(
  wallLength: number,
  t: number,
  width: number,
): { t: number; width: number } {
  const usable = Math.max(wallLength - 0.02, 0.1);
  const nextWidth = Math.min(Math.max(0.1, width), usable);
  if (wallLength < 1e-6) return { t: 0.5, width: nextWidth };
  const half = nextWidth / (2 * wallLength);
  const minT = Math.min(half, 0.5);
  const maxT = Math.max(1 - half, 0.5);
  const nextT = Math.min(Math.max(t, minT), maxT);
  return { t: nextT, width: nextWidth };
}

/** World-space segment of an opening along a wall. */
export function openingSpanOnWall(
  start: { x: number; z: number },
  end: { x: number; z: number },
  t: number,
  width: number,
): { a: { x: number; z: number }; b: { x: number; z: number }; length: number } {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-8) {
    return { a: { ...start }, b: { ...start }, length: 0 };
  }
  const ux = dx / length;
  const uz = dz / length;
  const half = width / 2;
  const cx = start.x + dx * t;
  const cz = start.z + dz * t;
  return {
    a: { x: cx - ux * half, z: cz - uz * half },
    b: { x: cx + ux * half, z: cz + uz * half },
    length,
  };
}

/**
 * Solid wall spans remaining after cutting openings (sorted along the wall).
 * Returns normalized [t0, t1] intervals in 0..1.
 */
export function solidWallIntervals(
  wallLength: number,
  openings: readonly { t: number; width: number }[],
): Array<{ t0: number; t1: number }> {
  if (wallLength < 1e-8) return [];
  const gaps = openings
    .map((o) => {
      const half = o.width / (2 * wallLength);
      return { t0: Math.max(0, o.t - half), t1: Math.min(1, o.t + half) };
    })
    .sort((a, b) => a.t0 - b.t0);

  const merged: Array<{ t0: number; t1: number }> = [];
  for (const gap of gaps) {
    const last = merged[merged.length - 1];
    if (!last || gap.t0 > last.t1) merged.push({ ...gap });
    else last.t1 = Math.max(last.t1, gap.t1);
  }

  const solids: Array<{ t0: number; t1: number }> = [];
  let cursor = 0;
  for (const gap of merged) {
    if (gap.t0 - cursor > 1e-4) solids.push({ t0: cursor, t1: gap.t0 });
    cursor = gap.t1;
  }
  if (1 - cursor > 1e-4) solids.push({ t0: cursor, t1: 1 });
  return solids;
}

export class Opening {
  public readonly id: string;
  public wallId: string;
  public type: OpeningType;
  public t: number;
  public width: number;
  public height: number;
  public sill: number;

  public constructor(init: OpeningInit) {
    const defaults = defaultsForOpeningType(init.type);
    this.id = init.id ?? createId('opening');
    this.wallId = init.wallId;
    this.type = init.type;
    this.t = init.t ?? defaults.t;
    this.width = init.width ?? defaults.width;
    this.height = init.height ?? defaults.height;
    this.sill = init.sill ?? defaults.sill;
  }

  public applyClamp(wallLength: number): void {
    const clamped = clampOpeningToWall(wallLength, this.t, this.width);
    this.t = clamped.t;
    this.width = clamped.width;
    if (this.type === 'door') {
      this.sill = 0;
      this.height = Math.max(0.5, this.height);
    } else {
      this.sill = Math.max(0, this.sill);
      this.height = Math.max(0.3, this.height);
    }
  }

  public toSnapshot(): OpeningSnapshot {
    return {
      id: this.id,
      wallId: this.wallId,
      type: this.type,
      t: this.t,
      width: this.width,
      height: this.height,
      sill: this.sill,
    };
  }

  public static fromSnapshot(snapshot: OpeningSnapshot): Opening {
    return new Opening(snapshot);
  }
}
