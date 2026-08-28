import type { ShapeKind } from './types';

export interface ShapeDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/**
 * Base (`scale === 1`) bounding box for every shape kind, in scene units.
 * Single source of truth consumed by `SceneObject` (footprint/resting
 * height), `ThreeMeshFactory` (geometry sizing) and `SvgRenderer` (2D
 * footprint sizing) so all three stay in sync.
 */
export const SHAPE_DIMENSIONS: Record<ShapeKind, ShapeDimensions> = {
  cube: { width: 1, height: 1, depth: 1 },
  sphere: { width: 1.2, height: 1.2, depth: 1.2 },
  cylinder: { width: 1, height: 1.2, depth: 1 },
  pyramid: { width: 1.2, height: 1.3, depth: 1.2 },
};
