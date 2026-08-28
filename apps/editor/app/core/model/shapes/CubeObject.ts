import { SceneObject } from '../SceneObject';
import type { SceneObjectInit } from '../types';

export class CubeObject extends SceneObject {
  public constructor(init?: SceneObjectInit) {
    super('cube', init);
  }
}
