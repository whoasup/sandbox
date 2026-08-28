import { SceneObject } from '../SceneObject';
import type { SceneObjectInit } from '../types';

export class PyramidObject extends SceneObject {
  public constructor(init?: SceneObjectInit) {
    super('pyramid', init);
  }
}
