import type { ShapeKind, ShapeMeta } from './types';

/**
 * Canonical list of primitives the editor can place. Shared between
 * `UiShapeIcon` (icon rendering) and the editor app's domain model, so the
 * set of available shapes is declared in exactly one place.
 */
export const SHAPE_CATALOG: readonly ShapeMeta[] = [
  { kind: 'cube', label: 'Куб' },
  { kind: 'sphere', label: 'Шар' },
  { kind: 'cylinder', label: 'Цилиндр' },
  { kind: 'pyramid', label: 'Пирамида' },
];

export function getShapeMeta(kind: ShapeKind): ShapeMeta {
  const meta = SHAPE_CATALOG.find((entry) => entry.kind === kind);
  if (!meta) throw new Error(`Unknown shape kind: ${kind}`);
  return meta;
}
