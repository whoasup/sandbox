import type { InjectionKey, Ref, ShallowRef } from 'vue';
import { inject, provide, reactive, ref, shallowRef } from 'vue';
import type { ShapeKind, SurfaceKind } from '@sandbox/ui-kit';
import { SceneDocument } from '../core/model/SceneDocument';
import type { SceneObject } from '../core/model/SceneObject';
import type { SceneSettings, SceneSettingsPatch } from '../core/model/SceneSettings';
import type { SelectionRef } from '../core/model/types';
import type { Point2, WallObject } from '../core/model/WallObject';
import type { EditorTool } from '../core/render/ISceneRenderer';

export type EditorMode = '2d' | '3d';

const PLACEMENT_RADIUS = 2.2;

export interface WallDefaults {
  height: number;
  thickness: number;
}

export interface EditorDocumentContext {
  document: SceneDocument;
  objects: ShallowRef<SceneObject[]>;
  walls: ShallowRef<WallObject[]>;
  selection: ShallowRef<SelectionRef>;
  /** Convenience mirror of `selection.value?.id ?? null` for existing callers. */
  selectedId: ShallowRef<string | null>;
  settings: ShallowRef<SceneSettings>;
  mode: ShallowRef<EditorMode>;
  tool: Ref<EditorTool>;
  wallDefaults: WallDefaults;
  activeSurface: ShallowRef<SurfaceKind>;
  activeColor: ShallowRef<string>;
  addShape: (kind: ShapeKind) => void;
  addWall: (start: Point2, end: Point2) => void;
  removeSelected: () => void;
  applySurfaceToSelection: (surface: SurfaceKind) => void;
  applyColorToSelection: (color: string) => void;
  selectEntity: (selection: SelectionRef) => void;
  selectShape: (id: string | null) => void;
  moveShape: (id: string, x: number, z: number) => void;
  moveWall: (id: string, x: number, z: number) => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedWallThickness: (thickness: number) => void;
  replaceSelectedKind: (kind: ShapeKind) => void;
  setSelectedRotation: (rotationY: number) => void;
  setSelectedScale: (scale: number) => void;
  duplicateSelected: () => void;
  patchSettings: (patch: SceneSettingsPatch) => void;
  snapPoint: (point: Point2) => Point2;
}

const EDITOR_DOCUMENT_KEY: InjectionKey<EditorDocumentContext> = Symbol('editor-document');

function nextPlacement(existingCount: number): { x: number; z: number } {
  if (existingCount === 0) return { x: 0, z: 0 };
  const angle = existingCount * 2.4;
  const radius = PLACEMENT_RADIUS + Math.floor(existingCount / 6) * 1.4;
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

/** Creates the shared editor state and makes it available to descendants via `provide`. Call once, from the page root. */
export function createEditorDocumentContext(): EditorDocumentContext {
  const document = new SceneDocument();
  const objects = shallowRef<SceneObject[]>(document.list());
  const walls = shallowRef<WallObject[]>(document.listWalls());
  const selection = shallowRef<SelectionRef>(null);
  const selectedId = shallowRef<string | null>(null);
  const settings = shallowRef<SceneSettings>(document.settings);
  const mode = shallowRef<EditorMode>('3d');
  const tool = ref<EditorTool>('select');
  const wallDefaults = reactive<WallDefaults>({ height: 2.5, thickness: 0.2 });
  const activeSurface = shallowRef<SurfaceKind>('wood');
  const activeColor = shallowRef<string>('#c9945f');

  document.on('change', (payload) => {
    objects.value = payload.objects;
    walls.value = payload.walls;
  });
  document.on('settings', (next) => {
    settings.value = next;
  });
  document.on('select', (ref) => {
    selection.value = ref;
    selectedId.value = ref?.id ?? null;
    if (ref?.type === 'shape') {
      const shape = document.get(ref.id);
      if (shape) {
        activeSurface.value = shape.surface;
        activeColor.value = shape.color;
      }
    } else if (ref?.type === 'wall') {
      const wall = document.getWall(ref.id);
      if (wall) {
        activeSurface.value = wall.surface;
        activeColor.value = wall.color;
      }
    }
  });

  const context: EditorDocumentContext = {
    document,
    objects,
    walls,
    selection,
    selectedId,
    settings,
    mode,
    tool,
    wallDefaults,
    activeSurface,
    activeColor,
    addShape(kind) {
      const { x, z } = nextPlacement(document.list().length);
      document.addShape(kind, {
        position: { x, z },
        surface: activeSurface.value,
        color: activeColor.value,
      });
    },
    addWall(start, end) {
      document.addWall({
        start,
        end,
        height: wallDefaults.height,
        thickness: wallDefaults.thickness,
        surface: activeSurface.value,
        color: activeColor.value,
      });
    },
    removeSelected() {
      document.removeSelected();
    },
    applySurfaceToSelection(surface) {
      activeSurface.value = surface;
      if (!selection.value) return;
      if (selection.value.type === 'shape') {
        document.setSurface(selection.value.id, surface);
      } else {
        document.setWallSurface(selection.value.id, surface);
      }
    },
    applyColorToSelection(color) {
      activeColor.value = color;
      if (!selection.value) return;
      if (selection.value.type === 'shape') {
        document.setColor(selection.value.id, color);
      } else {
        document.setWallColor(selection.value.id, color);
      }
    },
    selectEntity(next) {
      document.select(next);
    },
    selectShape(id) {
      document.select(id ? { type: 'shape', id } : null);
    },
    moveShape(id, x, z) {
      document.moveShape(id, x, z);
    },
    moveWall(id, x, z) {
      document.moveWall(id, x, z);
    },
    setSelectedWallHeight(height) {
      if (selection.value?.type !== 'wall') return;
      document.setWallHeight(selection.value.id, height);
    },
    setSelectedWallThickness(thickness) {
      if (selection.value?.type !== 'wall') return;
      document.setWallThickness(selection.value.id, thickness);
    },
    replaceSelectedKind(kind) {
      if (selection.value?.type !== 'shape') return;
      document.replaceKind(selection.value.id, kind);
    },
    setSelectedRotation(rotationY) {
      if (selection.value?.type !== 'shape') return;
      document.setRotationY(selection.value.id, rotationY);
    },
    setSelectedScale(scale) {
      if (selection.value?.type !== 'shape') return;
      document.setScale(selection.value.id, scale);
    },
    duplicateSelected() {
      if (selection.value?.type !== 'shape') return;
      document.duplicate(selection.value.id);
    },
    patchSettings(patch) {
      document.patchSettings(patch);
    },
    snapPoint(point) {
      return document.snapPoint(point);
    },
  };

  provide(EDITOR_DOCUMENT_KEY, context);
  return context;
}

export function useEditorDocument(): EditorDocumentContext {
  const context = inject(EDITOR_DOCUMENT_KEY);
  if (!context) {
    throw new Error(
      'useEditorDocument() must be called within a component tree started by createEditorDocumentContext()',
    );
  }
  return context;
}
