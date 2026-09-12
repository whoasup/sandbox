import type { Point2, WallObject } from '@sandbox/editor-core';

const PLAYER_RADIUS = 0.35;

/** True if a circle of `radius` around `point` intersects any wall segment. */
export function collidesWithWalls(
  point: Point2,
  walls: readonly WallObject[],
  radius = PLAYER_RADIUS,
): boolean {
  for (const wall of walls) {
    if (wall.distanceToPoint(point) <= wall.thickness / 2 + radius) return true;
  }
  return false;
}

/**
 * Try to move from `from` toward `to`, sliding along axes if the full
 * step would hit a wall.
 */
export function resolveWalkMove(
  from: Point2,
  to: Point2,
  walls: readonly WallObject[],
  radius = PLAYER_RADIUS,
): Point2 {
  if (!collidesWithWalls(to, walls, radius)) return to;
  const xOnly = { x: to.x, z: from.z };
  if (!collidesWithWalls(xOnly, walls, radius)) return xOnly;
  const zOnly = { x: from.x, z: to.z };
  if (!collidesWithWalls(zOnly, walls, radius)) return zOnly;
  return from;
}
