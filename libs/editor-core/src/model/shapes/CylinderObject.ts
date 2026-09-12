import { SceneObject } from '../SceneObject';
import type { SceneObjectInit } from '../types';

export class CylinderObject extends SceneObject {
  public constructor(init?: SceneObjectInit) {
    super('cylinder', init);
  }
}
