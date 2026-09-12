import type { FurnitureObject } from '../model/FurnitureObject';
import type { Opening } from '../model/Opening';
import type { Room } from '../model/Room';
import type { SceneObject } from '../model/SceneObject';
import type { SceneSettings } from '../model/SceneSettings';
import type { StairObject } from '../model/StairObject';
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
    rooms: readonly Room[],
    openings: readonly Opening[],
    furniture: readonly FurnitureObject[],
    stairs: readonly StairObject[],
    selection: SelectionRef,
    settings: SceneSettings,
  ): void;
  dispose(): void;
}

export type EditorTool = 'select' | 'wall' | 'door' | 'window' | 'stair';

export interface RendererInteractionEvents {
  onSelect?: (selection: SelectionRef) => void;
  onMoveShape?: (id: string, x: number, z: number) => void;
  onMoveWall?: (id: string, x: number, z: number) => void;
  onMoveFurniture?: (id: string, x: number, z: number) => void;
  onMoveStair?: (id: string, x: number, z: number) => void;
  onAddWall?: (start: Point2, end: Point2) => void;
  onAddOpening?: (type: 'door' | 'window', point: Point2, wallId?: string) => void;
  onAddStair?: (point: Point2) => void;
  onActivateStair?: (id: string) => void;
  /** Optional snap helper used while drawing walls in 2D. */
  snapPoint?: (point: Point2, angleFrom?: Point2 | null) => Point2;
  /** Fired when a drag gesture starts / ends (for history coalescing). */
  onMoveGestureStart?: () => void;
  onMoveGestureEnd?: () => void;
  /** Live wall-draft length in meters (null when not drawing). */
  onWallDraftLength?: (length: number | null) => void;
  onCameraModeChange?: (mode: 'orbit' | 'top' | 'walk') => void;
}

export interface RendererToolState {
  tool: EditorTool;
}
