import type { SceneObject } from '../model/SceneObject';

/**
 * Both the 2D (SVG) and 3D (three.js) views implement this contract, so
 * the Vue layer can mount/update/dispose either renderer identically —
 * the only thing that changes when the user flips the mode toggle is
 * which concrete class gets instantiated.
 */
export interface ISceneRenderer {
  mount(container: HTMLElement): void;
  render(objects: readonly SceneObject[], selectedId: string | null): void;
  dispose(): void;
}

export interface RendererInteractionEvents {
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, z: number) => void;
}
