import { roundToStep } from '../model/SceneSettings';
import type { Point2, WallObject } from '../model/WallObject';

export interface SnapOptions {
  snapEnabled: boolean;
  gridStep: number;
  endpointRadius?: number;
  /** Constrain angle from `from` toward `to` to 0/45/90… when set. */
  angleFrom?: Point2 | null;
  angleStepDeg?: number;
}

export function snapToGrid(point: Point2, gridStep: number): Point2 {
  return {
    x: roundToStep(point.x, gridStep),
    z: roundToStep(point.z, gridStep),
  };
}

export function snapToWallEndpoints(
  point: Point2,
  walls: readonly WallObject[],
  radius: number,
): Point2 | null {
  let best: Point2 | null = null;
  let bestDist = radius;
  for (const wall of walls) {
    for (const endpoint of [wall.start, wall.end]) {
      const dist = Math.hypot(point.x - endpoint.x, point.z - endpoint.z);
      if (dist <= bestDist) {
        bestDist = dist;
        best = { ...endpoint };
      }
    }
  }
  return best;
}

/** Snap the direction from `from` to `to` onto the nearest N° multiple. */
export function snapAngle45(from: Point2, to: Point2, stepDeg = 45): Point2 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-8) return { ...to };
  const angle = Math.atan2(dx, dz);
  const step = (stepDeg * Math.PI) / 180;
  const snapped = Math.round(angle / step) * step;
  return {
    x: from.x + Math.sin(snapped) * length,
    z: from.z + Math.cos(snapped) * length,
  };
}

/**
 * Snap pipeline: optional 45° constraint → grid → wall endpoints
 * (endpoints win when within radius).
 */
export function snapPointPipeline(
  point: Point2,
  walls: readonly WallObject[],
  options: SnapOptions,
): Point2 {
  let next = { ...point };
  if (options.angleFrom) {
    next = snapAngle45(options.angleFrom, next, options.angleStepDeg ?? 45);
  }
  if (options.snapEnabled) {
    next = snapToGrid(next, options.gridStep);
  }
  const endpoint = snapToWallEndpoints(next, walls, options.endpointRadius ?? 0.35);
  if (endpoint) return endpoint;
  // Also try against the raw point for endpoint preference.
  const rawEndpoint = snapToWallEndpoints(point, walls, options.endpointRadius ?? 0.35);
  return rawEndpoint ?? next;
}
