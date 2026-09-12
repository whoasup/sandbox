import type { InjectionKey, Ref, ShallowRef } from 'vue';
import { computed, inject, provide, reactive, ref, shallowRef } from 'vue';
import type { ShapeKind, SurfaceKind } from '@sandbox/ui-kit';
import { HistoryStack } from '../core/history/HistoryStack';
import { SnapshotCommand, captureSnapshotCommand } from '../core/history/SnapshotCommand';
import { SceneDocument } from '../core/model/SceneDocument';
import type { Opening, OpeningType } from '../core/model/Opening';
import type { Room } from '../core/model/Room';
import type { SceneObject } from '../core/model/SceneObject';
import type { SceneSettings, SceneSettingsPatch } from '../core/model/SceneSettings';
import type { SceneSnapshot, SelectionRef } from '../core/model/types';
import type { Point2, WallObject } from '../core/model/WallObject';
import type { EditorTool } from '../core/render/ISceneRenderer';
import type { CameraMode } from '../core/render/three/ThreeRenderer';

export type EditorMode = '2d' | '3d';
export type { CameraMode };

const PLACEMENT_RADIUS = 2.2;

export interface WallDefaults {
  height: number;
  thickness: number;
}

export interface EditorClipboard {
  kind: 'shape' | 'wall' | 'opening';
  snapshot: SceneSnapshot;
  entityId: string;
}

export interface EditorDocumentContext {
  document: SceneDocument;
  history: HistoryStack;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  objects: ShallowRef<SceneObject[]>;
  walls: ShallowRef<WallObject[]>;
  rooms: ShallowRef<Room[]>;
  openings: ShallowRef<Opening[]>;
  selection: ShallowRef<SelectionRef>;
  selectedId: ShallowRef<string | null>;
  settings: ShallowRef<SceneSettings>;
  mode: ShallowRef<EditorMode>;
  cameraMode: Ref<CameraMode>;
  tool: Ref<EditorTool>;
  showCeiling: Ref<boolean>;
  wallDefaults: WallDefaults;
  activeSurface: ShallowRef<SurfaceKind>;
  activeColor: ShallowRef<string>;
  wallDraftLength: Ref<number | null>;
  addShape: (kind: ShapeKind) => void;
  addWall: (start: Point2, end: Point2) => void;
  addOpeningAtPoint: (type: OpeningType, point: Point2, wallId?: string) => void;
  updateSelectedOpening: (
    patch: Partial<{ type: OpeningType; t: number; width: number; height: number; sill: number }>,
  ) => void;
  removeSelected: () => void;
  applySurfaceToSelection: (surface: SurfaceKind) => void;
  applyColorToSelection: (color: string) => void;
  selectEntity: (selection: SelectionRef) => void;
  selectShape: (id: string | null) => void;
  moveShape: (id: string, x: number, z: number) => void;
  moveWall: (id: string, x: number, z: number) => void;
  beginMoveGesture: () => void;
  endMoveGesture: (label?: string) => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedWallThickness: (thickness: number) => void;
  setSelectedRoomName: (name: string) => void;
  setSelectedRoomFloorSurface: (surface: SurfaceKind | undefined) => void;
  replaceSelectedKind: (kind: ShapeKind) => void;
  setSelectedRotation: (rotationY: number) => void;
  setSelectedScale: (scale: number) => void;
  duplicateSelected: () => void;
  patchSettings: (patch: SceneSettingsPatch) => void;
  snapPoint: (point: Point2, angleFrom?: Point2 | null) => Point2;
  undo: () => void;
  redo: () => void;
  nudgeSelected: (dx: number, dz: number) => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  setWallDraftLength: (length: number | null) => void;
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
  const history = new HistoryStack(100);
  const historyTick = ref(0);
  const objects = shallowRef<SceneObject[]>(document.list());
  const walls = shallowRef<WallObject[]>(document.listWalls());
  const rooms = shallowRef<Room[]>(document.listRooms());
  const openings = shallowRef<Opening[]>(document.listOpenings());
  const selection = shallowRef<SelectionRef>(null);
  const selectedId = shallowRef<string | null>(null);
  const settings = shallowRef<SceneSettings>(document.settings);
  const mode = shallowRef<EditorMode>('3d');
  const cameraMode = ref<CameraMode>('orbit');
  const showCeiling = ref(false);
  const tool = ref<EditorTool>('select');
  const wallDefaults = reactive<WallDefaults>({ height: 2.5, thickness: 0.2 });
  const activeSurface = shallowRef<SurfaceKind>('wood');
  const activeColor = shallowRef<string>('#c9945f');
  const wallDraftLength = ref<number | null>(null);
  let clipboard: EditorClipboard | null = null;
  let gestureBefore: SceneSnapshot | null = null;

  const bumpHistory = () => {
    historyTick.value += 1;
  };

  const run = (label: string, mutate: () => void) => {
    history.pushExecuted(captureSnapshotCommand(document, label, mutate));
    bumpHistory();
  };

  document.on('change', (payload) => {
    objects.value = payload.objects;
    walls.value = payload.walls;
    rooms.value = payload.rooms;
    openings.value = payload.openings;
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
    } else if (ref?.type === 'room') {
      const room = document.getRoom(ref.id);
      if (room) {
        if (room.floorSurface) activeSurface.value = room.floorSurface;
        activeColor.value = room.floorColor;
      }
    }
  });

  const canUndo = computed(() => {
    void historyTick.value;
    return history.canUndo;
  });
  const canRedo = computed(() => {
    void historyTick.value;
    return history.canRedo;
  });

  const context: EditorDocumentContext = {
    document,
    history,
    canUndo,
    canRedo,
    objects,
    walls,
    rooms,
    openings,
    selection,
    selectedId,
    settings,
    mode,
    cameraMode,
    showCeiling,
    tool,
    wallDefaults,
    activeSurface,
    activeColor,
    wallDraftLength,
    addShape(kind) {
      const { x, z } = nextPlacement(document.list().length);
      run('Добавить фигуру', () => {
        document.addShape(kind, {
          position: { x, z },
          surface: activeSurface.value,
          color: activeColor.value,
        });
      });
    },
    addWall(start, end) {
      run('Добавить стену', () => {
        document.addWall({
          start,
          end,
          height: wallDefaults.height,
          thickness: wallDefaults.thickness,
          surface: activeSurface.value,
          color: activeColor.value,
        });
      });
    },
    addOpeningAtPoint(type, point, wallId) {
      run(type === 'door' ? 'Добавить дверь' : 'Добавить окно', () => {
        document.addOpeningAtPoint(type, point, wallId);
      });
    },
    updateSelectedOpening(patch) {
      if (selection.value?.type !== 'opening') return;
      const id = selection.value.id;
      run('Изменить проём', () => {
        document.updateOpening(id, patch);
      });
    },
    removeSelected() {
      if (!selection.value) return;
      run('Удалить', () => {
        document.removeSelected();
      });
    },
    applySurfaceToSelection(surface) {
      activeSurface.value = surface;
      if (!selection.value) return;
      const sel = selection.value;
      run('Поверхность', () => {
        if (sel.type === 'shape') document.setSurface(sel.id, surface);
        else if (sel.type === 'wall') document.setWallSurface(sel.id, surface);
        else if (sel.type === 'room') document.setRoomFloorSurface(sel.id, surface);
      });
    },
    applyColorToSelection(color) {
      activeColor.value = color;
      if (!selection.value) return;
      const sel = selection.value;
      run('Цвет', () => {
        if (sel.type === 'shape') document.setColor(sel.id, color);
        else if (sel.type === 'wall') document.setWallColor(sel.id, color);
        else if (sel.type === 'room') document.setRoomFloorColor(sel.id, color);
      });
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
    beginMoveGesture() {
      if (!gestureBefore) gestureBefore = document.toSnapshot();
    },
    endMoveGesture(label = 'Переместить') {
      if (!gestureBefore) return;
      const after = document.toSnapshot();
      history.pushExecuted(new SnapshotCommand(label, document, gestureBefore, after));
      gestureBefore = null;
      bumpHistory();
    },
    setSelectedWallHeight(height) {
      if (selection.value?.type !== 'wall') return;
      const id = selection.value.id;
      run('Высота стены', () => document.setWallHeight(id, height));
    },
    setSelectedWallThickness(thickness) {
      if (selection.value?.type !== 'wall') return;
      const id = selection.value.id;
      run('Толщина стены', () => document.setWallThickness(id, thickness));
    },
    setSelectedRoomName(name) {
      if (selection.value?.type !== 'room') return;
      const id = selection.value.id;
      run('Имя комнаты', () => document.setRoomName(id, name));
    },
    setSelectedRoomFloorSurface(surface) {
      if (selection.value?.type !== 'room') return;
      const id = selection.value.id;
      run('Пол комнаты', () => document.setRoomFloorSurface(id, surface));
    },
    replaceSelectedKind(kind) {
      if (selection.value?.type !== 'shape') return;
      const id = selection.value.id;
      run('Сменить фигуру', () => document.replaceKind(id, kind));
    },
    setSelectedRotation(rotationY) {
      if (selection.value?.type !== 'shape') return;
      const id = selection.value.id;
      run('Поворот', () => document.setRotationY(id, rotationY));
    },
    setSelectedScale(scale) {
      if (selection.value?.type !== 'shape') return;
      const id = selection.value.id;
      run('Масштаб', () => document.setScale(id, scale));
    },
    duplicateSelected() {
      if (selection.value?.type !== 'shape') return;
      const id = selection.value.id;
      run('Дублировать', () => document.duplicate(id));
    },
    patchSettings(patch) {
      run('Настройки сцены', () => document.patchSettings(patch));
    },
    snapPoint(point, angleFrom = null) {
      return document.snapPoint(point, 0.35, angleFrom);
    },
    undo() {
      history.undo();
      bumpHistory();
    },
    redo() {
      history.redo();
      bumpHistory();
    },
    nudgeSelected(dx, dz) {
      const sel = selection.value;
      if (!sel) return;
      run('Сдвиг', () => {
        if (sel.type === 'shape') {
          const shape = document.get(sel.id);
          if (!shape) return;
          document.moveShape(sel.id, shape.position.x + dx, shape.position.z + dz);
        } else if (sel.type === 'wall') {
          const wall = document.getWall(sel.id);
          if (!wall) return;
          document.moveWall(sel.id, wall.midpoint.x + dx, wall.midpoint.z + dz);
        }
      });
    },
    copySelected() {
      const sel = selection.value;
      if (!sel || sel.type === 'room') return;
      clipboard = {
        kind: sel.type,
        snapshot: document.toSnapshot(),
        entityId: sel.id,
      };
    },
    pasteClipboard() {
      if (!clipboard) return;
      const step = document.settings.field.gridStep || 0.5;
      const src = clipboard;
      run('Вставить', () => {
        if (src.kind === 'shape') {
          const shape = src.snapshot.objects.find((o) => o.id === src.entityId);
          if (!shape) return;
          document.addShape(shape.kind, {
            position: { x: shape.position.x + step, z: shape.position.z + step },
            rotationY: shape.rotationY,
            scale: shape.scale,
            surface: shape.surface,
            color: shape.color,
          });
        } else if (src.kind === 'wall') {
          const wall = src.snapshot.walls.find((w) => w.id === src.entityId);
          if (!wall) return;
          document.addWall({
            start: { x: wall.start.x + step, z: wall.start.z + step },
            end: { x: wall.end.x + step, z: wall.end.z + step },
            height: wall.height,
            thickness: wall.thickness,
            surface: wall.surface,
            color: wall.color,
          });
        } else if (src.kind === 'opening') {
          const opening = src.snapshot.openings.find((o) => o.id === src.entityId);
          if (!opening || !document.getWall(opening.wallId)) return;
          document.addOpening(opening.wallId, opening.type, {
            t: Math.min(0.9, opening.t + 0.1),
            width: opening.width,
            height: opening.height,
            sill: opening.sill,
          });
        }
      });
    },
    setWallDraftLength(length) {
      wallDraftLength.value = length;
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
