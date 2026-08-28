import type { SceneObject } from './SceneObject';
import { CubeObject, CylinderObject, PyramidObject, SphereObject } from './shapes';
import type { SceneObjectInit, ShapeKind } from './types';

type ShapeConstructor = new (init?: SceneObjectInit) => SceneObject;

/**
 * Factory pattern: maps a `ShapeKind` to its `SceneObject` subclass so
 * callers (the document, tests, ...) never need to know about the
 * concrete classes.
 */
export class ShapeFactory {
  private static readonly registry: ReadonlyMap<ShapeKind, ShapeConstructor> = new Map([
    ['cube', CubeObject],
    ['sphere', SphereObject],
    ['cylinder', CylinderObject],
    ['pyramid', PyramidObject],
  ]);

  public static create(kind: ShapeKind, init?: SceneObjectInit): SceneObject {
    const Ctor = ShapeFactory.registry.get(kind);
    if (!Ctor) {
      throw new Error(`ShapeFactory: unknown shape kind "${kind}"`);
    }
    return new Ctor(init);
  }

  public static supports(kind: string): kind is ShapeKind {
    return ShapeFactory.registry.has(kind as ShapeKind);
  }
}
