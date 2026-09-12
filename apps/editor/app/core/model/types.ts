import type { ShapeKind, SurfaceKind } from '@sandbox/ui-kit';
import type { RoomSnapshot } from './Room';
import type { SceneSettings } from './SceneSettings';
import type { WallObjectSnapshot } from './WallObject';

export type { ShapeKind, SurfaceKind };

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface Footprint {
  width: number;
  depth: number;
}

export interface SceneObjectSnapshot {
  id: string;
  kind: ShapeKind;
  position: Vector3Like;
  rotationY: number;
  scale: number;
  surface: SurfaceKind;
  color: string;
}

export interface SceneObjectInit {
  id?: string;
  position?: Partial<Pick<Vector3Like, 'x' | 'z'>>;
  rotationY?: number;
  scale?: number;
  surface?: SurfaceKind;
  color?: string;
}

/** Selection cursor pointing at a shape, wall, or room. */
export type SelectionRef =
  | { type: 'shape'; id: string }
  | { type: 'wall'; id: string }
  | { type: 'room'; id: string }
  | null;

/** In-memory / IndexedDB snapshot shape. */
export interface SceneSnapshot {
  objects: SceneObjectSnapshot[];
  walls: WallObjectSnapshot[];
  rooms: RoomSnapshot[];
  settings: SceneSettings;
}
