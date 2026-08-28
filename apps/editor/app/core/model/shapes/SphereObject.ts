import { SceneObject } from '../SceneObject';
import type { SceneObjectInit } from '../types';

export class SphereObject extends SceneObject {
  public constructor(init?: SceneObjectInit) {
    super('sphere', init);
  }
}
