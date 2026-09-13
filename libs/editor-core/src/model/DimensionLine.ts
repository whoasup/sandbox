import { createId } from '@sandbox/ui-kit';
import type { Point2 } from './WallObject';

export interface DimensionLineInit {
  id?: string;
  start: Point2;
  end: Point2;
  /** Perpendicular offset of the label from the segment (world meters). */
  offset?: number;
}

export interface DimensionLineSnapshot {
  id: string;
  start: Point2;
  end: Point2;
  offset: number;
}

/** User-drawn dimension annotation between two floor-plane points. */
export class DimensionLine {
  public readonly id: string;
  public start: Point2;
  public end: Point2;
  public offset: number;

  public constructor(init: DimensionLineInit) {
    this.id = init.id ?? createId('dim');
    this.start = { x: init.start.x, z: init.start.z };
    this.end = { x: init.end.x, z: init.end.z };
    this.offset = init.offset ?? 0.35;
  }

  public get length(): number {
    return Math.hypot(this.end.x - this.start.x, this.end.z - this.start.z);
  }

  public setEndpoints(start: Point2, end: Point2): void {
    this.start = { x: start.x, z: start.z };
    this.end = { x: end.x, z: end.z };
  }

  public setOffset(offset: number): void {
    this.offset = offset;
  }

  public toSnapshot(): DimensionLineSnapshot {
    return {
      id: this.id,
      start: { ...this.start },
      end: { ...this.end },
      offset: this.offset,
    };
  }

  public static fromSnapshot(snapshot: DimensionLineSnapshot): DimensionLine {
    return new DimensionLine(snapshot);
  }
}
