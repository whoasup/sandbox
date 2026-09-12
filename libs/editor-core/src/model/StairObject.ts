import { createId } from '@sandbox/ui-kit';

export type StairDirection = 'up' | 'down';

export interface StairObjectInit {
  id?: string;
  linkId?: string;
  floorId: string;
  targetFloorId: string;
  position?: { x: number; z: number };
  rotationY?: number;
  width?: number;
  depth?: number;
  stepCount?: number;
  direction?: StairDirection;
}

export interface StairObjectSnapshot {
  id: string;
  linkId: string;
  floorId: string;
  targetFloorId: string;
  position: { x: number; z: number };
  rotationY: number;
  width: number;
  depth: number;
  stepCount: number;
  direction: StairDirection;
}

/**
 * Stair flight linking two floors. Paired markers share `linkId` so delete
 * on either side can clean the other (handled at the project layer).
 */
export class StairObject {
  public readonly id: string;
  public readonly linkId: string;
  public floorId: string;
  public targetFloorId: string;
  public position: { x: number; z: number };
  public rotationY: number;
  public width: number;
  public depth: number;
  public stepCount: number;
  public direction: StairDirection;

  public constructor(init: StairObjectInit) {
    this.id = init.id ?? createId('stair');
    this.linkId = init.linkId ?? createId('stairlink');
    this.floorId = init.floorId;
    this.targetFloorId = init.targetFloorId;
    this.position = { x: init.position?.x ?? 0, z: init.position?.z ?? 0 };
    this.rotationY = init.rotationY ?? 0;
    this.width = init.width ?? 1.0;
    this.depth = init.depth ?? 2.5;
    this.stepCount = init.stepCount ?? 12;
    this.direction = init.direction ?? 'up';
  }

  public moveTo(x: number, z: number): void {
    this.position = { x, z };
  }

  public toSnapshot(): StairObjectSnapshot {
    return {
      id: this.id,
      linkId: this.linkId,
      floorId: this.floorId,
      targetFloorId: this.targetFloorId,
      position: { ...this.position },
      rotationY: this.rotationY,
      width: this.width,
      depth: this.depth,
      stepCount: this.stepCount,
      direction: this.direction,
    };
  }

  public static fromSnapshot(snapshot: StairObjectSnapshot): StairObject {
    return new StairObject(snapshot);
  }

  /** Mirror stair for the opposite floor (inverted direction, same link). */
  public createPair(pairId?: string): StairObject {
    return new StairObject({
      id: pairId,
      linkId: this.linkId,
      floorId: this.targetFloorId,
      targetFloorId: this.floorId,
      position: { ...this.position },
      rotationY: this.rotationY,
      width: this.width,
      depth: this.depth,
      stepCount: this.stepCount,
      direction: this.direction === 'up' ? 'down' : 'up',
    });
  }
}

export function assertValidStairTarget(floorId: string, targetFloorId: string): void {
  if (!floorId || !targetFloorId) {
    throw new Error('Stair requires floorId and targetFloorId');
  }
  if (floorId === targetFloorId) {
    throw new Error('Stair targetFloorId must differ from floorId');
  }
}
