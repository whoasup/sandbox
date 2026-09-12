import type { SceneObject } from '../model/SceneObject';
import type { SceneSettings } from '../model/SceneSettings';
import type { SelectionRef } from '../model/types';
import type { Point2, WallObject } from '../model/WallObject';

/**
 * Both the 2D (SVG) and 3D (three.js) views implement this contract, so
 * the Vue layer can mount/update/dispose either renderer identically —
 * the only thing that changes when the user flips the mode toggle is
 * which concrete class gets instantiated.
 */
export interface ISceneRenderer {
  mount(container: HTMLElement): void;
  render(
    objects: readonly SceneObject[],
    walls: readonly WallObject[],
    selection: SelectionRef,
    settings: SceneSettings,
  ): void;
  dispose(): void;
}

export type EditorTool = 'select' | 'wall';

export interface RendererInteractionEvents {
  onSelect?: (selection: SelectionRef) => void;
  onMoveShape?: (id: string, x: number, z: number) => void;
  onMoveWall?: (id: string, x: number, z: number) => void;
  onAddWall?: (start: Point2, end: Point2) => void;
  /** Optional snap helper used while drawing walls in 2D. */
  snapPoint?: (point: Point2) => Point2;
}

export interface RendererToolState {
  tool: EditorTool;
}
