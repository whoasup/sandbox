export type ShapeKind = 'cube' | 'sphere' | 'cylinder' | 'pyramid';

export interface ShapeMeta {
  readonly kind: ShapeKind;
  readonly label: string;
}
