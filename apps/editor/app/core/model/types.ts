import type { ShapeKind, SurfaceKind } from '@sandbox/ui-kit';
import type { SceneSettings } from './SceneSettings';

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

/** In-memory / future IndexedDB snapshot shape (Epic 05). */
export interface SceneSnapshot {
  objects: SceneObjectSnapshot[];
  settings: SceneSettings;
}
