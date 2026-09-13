import {
  HistoryStack,
  SnapshotCommand,
  captureSnapshotCommand,
  SceneDocument,
} from '@sandbox/editor-core';
import type {
  DimensionLine,
  FurnitureObject,
  Opening,
  OpeningType,
  Room,
  SceneObject,
  SceneSettings,
  SceneSettingsPatch,
  StairDirection,
  StairObject,
  StairObjectSnapshot,
  SceneSnapshot,
  SelectionRef,
  Point2,
  WallObject,
} from '@sandbox/editor-core';
import type { InjectionKey, Ref, ShallowRef } from 'vue';
import { computed, inject, provide, reactive, ref, shallowRef } from 'vue';
import type { FurnitureCatalogId, ShapeKind, SurfaceKind } from '@sandbox/ui-kit';

import type { EditorTool } from '../core/render/ISceneRenderer';
import type { CameraMode } from '../core/render/three/cameraModes';

export type EditorMode = '2d' | '3d';
export type { CameraMode };

const PLACEMENT_RADIUS = 2.2;

export interface WallDefaults {
  height: number;
  thickness: number;
}

export interface EditorClipboard {
  kind: 'shape' | 'wall' | 'opening' | 'furniture';
  snapshot: SceneSnapshot;
  entityId: string;
}

export interface FloorOption {
  id: string;
  name: string;
}

export interface FloorContext {
  activeFloorId: string;
  floors: FloorOption[];
}

export interface StairProjectHooks {
  /** Persist paired marker on the other floor after add/update. */
  onStairUpsert?: (stair: StairObjectSnapshot) => void;
  /** Remove both ends of a stair link across floors. */
  onStairRemoved?: (linkId: string) => void;
  /** Switch to the stair's target floor. */
  onActivateStair?: (stairId: string) => void;
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
  furniture: ShallowRef<FurnitureObject[]>;
  stairs: ShallowRef<StairObject[]>;
  dimensions: ShallowRef<DimensionLine[]>;
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
  activeFloorId: Ref<string>;
  floorOptions: ShallowRef<FloorOption[]>;
  setFloorContext: (ctx: FloorContext) => void;
  setStairProjectHooks: (hooks: StairProjectHooks) => void;
  addShape: (kind: ShapeKind) => void;
  addFurniture: (catalogId: FurnitureCatalogId) => void;
  addWall: (start: Point2, end: Point2) => void;
  addOpeningAtPoint: (type: OpeningType, point: Point2, wallId?: string) => void;
  addStairAtPoint: (point: Point2) => void;
  addDimension: (start: Point2, end: Point2) => void;
  updateSelectedOpening: (
    patch: Partial<{ type: OpeningType; t: number; width: number; height: number; sill: number }>,
  ) => void;
  updateSelectedStair: (
    patch: Partial<{
      targetFloorId: string;
      width: number;
      depth: number;
      stepCount: number;
      direction: StairDirection;
      rotationY: number;
    }>,
  ) => void;
  removeSelected: () => void;
  applySurfaceToSelection: (surface: SurfaceKind) => void;
  applyColorToSelection: (color: string) => void;
  selectEntity: (selection: SelectionRef) => void;
  selectShape: (id: string | null) => void;
  moveShape: (id: string, x: number, z: number) => void;
  moveWall: (id: string, x: number, z: number) => void;
  moveFurniture: (id: string, x: number, z: number) => void;
  moveStair: (id: string, x: number, z: number) => void;
  activateStair: (id: string) => void;
  beginMoveGesture: () => void;
  endMoveGesture: (label?: string) => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedWallThickness: (thickness: number) => void;
  setSelectedRoomName: (name: string) => void;
  setSelectedRoomFloorSurface: (surface: SurfaceKind | undefined) => void;
  replaceSelectedKind: (kind: ShapeKind) => void;
  setSelectedRotation: (rotationY: number) => void;
  setSelectedScale: (scale: number) => void;
  setSelectedFurnitureSize: (patch: { width?: number; depth?: number; height?: number }) => void;
  duplicateSelected: () => void;
  patchSettings: (patch: SceneSettingsPatch) => void;
  snapPoint: (point: Point2, angleFrom?: Point2 | null) => Point2;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  nudgeSelected: (dx: number, dz: number) => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  setWallDraftLength: (length: number | null) => void;
}

const EDITOR_DOCUMENT_KEY: InjectionKey<EditorDocumentContext> =
  Symbol.for('sandbox.editor-document');

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
  const furniture = shallowRef<FurnitureObject[]>(document.listFurniture());
  const stairs = shallowRef<StairObject[]>(document.listStairs());
  const dimensions = shallowRef<DimensionLine[]>(document.listDimensions());
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
  const activeFloorId = ref('');
  const floorOptions = shallowRef<FloorOption[]>([]);
  let stairHooks: StairProjectHooks = {};
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
    furniture.value = payload.furniture;
    stairs.value = payload.stairs;
    dimensions.value = payload.dimensions;
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
    } else if (ref?.type === 'furniture') {
      const item = document.getFurniture(ref.id);
      if (item) {
        activeSurface.value = item.surface;
        activeColor.value = item.color;
      }
    }
  });

  const canUndo = computed(() => {
    void historyTick.value;
    return history.canUndo;
  });

  const syncStairsAfterHistory = (apply: () => void) => {
    const before = new Set(document.listStairs().map((stair) => stair.linkId));
    apply();
    bumpHistory();
    const afterStairs = document.listStairs();
    const after = new Set(afterStairs.map((stair) => stair.linkId));
    for (const stair of afterStairs) {
      stairHooks.onStairUpsert?.(stair.toSnapshot());
    }
    for (const linkId of before) {
      if (!after.has(linkId)) stairHooks.onStairRemoved?.(linkId);
    }
  };
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
    furniture,
    stairs,
    dimensions,
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
    activeFloorId,
    floorOptions,
    setFloorContext(ctx) {
      activeFloorId.value = ctx.activeFloorId;
      floorOptions.value = ctx.floors;
    },
    setStairProjectHooks(hooks) {
      stairHooks = hooks;
    },
    addShape(kind) {
      const { x, z } = nextPlacement(document.list().length + document.listFurniture().length);
      run('Добавить фигуру', () => {
        document.addShape(kind, {
          position: { x, z },
          surface: activeSurface.value,
          color: activeColor.value,
        });
      });
    },
    addFurniture(catalogId) {
      const { x, z } = nextPlacement(document.list().length + document.listFurniture().length);
      run('Добавить мебель', () => {
        document.addFurniture(catalogId, {
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
    addStairAtPoint(point) {
      const floorId = activeFloorId.value;
      const other = floorOptions.value.find((f) => f.id !== floorId);
      if (!floorId || !other) return;
      let created: StairObjectSnapshot | null = null;
      run('Добавить лестницу', () => {
        const stair = document.addStair({
          floorId,
          targetFloorId: other.id,
          position: point,
          direction: 'up',
        });
        created = stair.toSnapshot();
      });
      if (created) stairHooks.onStairUpsert?.(created);
    },
    addDimension(start, end) {
      run('Добавить размер', () => {
        document.addDimension({ start, end });
      });
    },
    updateSelectedOpening(patch) {
      if (selection.value?.type !== 'opening') return;
      const id = selection.value.id;
      run('Изменить проём', () => {
        document.updateOpening(id, patch);
      });
    },
    updateSelectedStair(patch) {
      if (selection.value?.type !== 'stair') return;
      const id = selection.value.id;
      let updated: StairObjectSnapshot | null = null;
      run('Изменить лестницу', () => {
        document.updateStair(id, patch);
        updated = document.getStair(id)?.toSnapshot() ?? null;
      });
      if (updated) stairHooks.onStairUpsert?.(updated);
    },
    removeSelected() {
      if (!selection.value) return;
      const sel = selection.value;
      let removedLinkId: string | null = null;
      if (sel.type === 'stair') {
        removedLinkId = document.getStair(sel.id)?.linkId ?? null;
      }
      run('Удалить', () => {
        document.removeSelected();
      });
      if (removedLinkId) stairHooks.onStairRemoved?.(removedLinkId);
    },
    applySurfaceToSelection(surface) {
      activeSurface.value = surface;
      if (!selection.value) return;
      const sel = selection.value;
      run('Поверхность', () => {
        if (sel.type === 'shape') document.setSurface(sel.id, surface);
        else if (sel.type === 'wall') document.setWallSurface(sel.id, surface);
        else if (sel.type === 'room') document.setRoomFloorSurface(sel.id, surface);
        else if (sel.type === 'furniture') document.setFurnitureMaterial(sel.id, { surface });
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
        else if (sel.type === 'furniture') document.setFurnitureMaterial(sel.id, { color });
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
    moveFurniture(id, x, z) {
      document.moveFurniture(id, x, z);
    },
    moveStair(id, x, z) {
      document.moveStair(id, x, z);
    },
    activateStair(id) {
      stairHooks.onActivateStair?.(id);
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
      // Sync paired stair position on the other floor after drag.
      if (selection.value?.type === 'stair') {
        const snap = document.getStair(selection.value.id)?.toSnapshot();
        if (snap) stairHooks.onStairUpsert?.(snap);
      }
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
      const sel = selection.value;
      if (!sel) return;
      if (sel.type === 'shape') {
        run('Поворот', () => document.setRotationY(sel.id, rotationY));
      } else if (sel.type === 'furniture') {
        run('Поворот', () => document.setFurnitureTransform(sel.id, { rotationY }));
      } else if (sel.type === 'stair') {
        let updated: StairObjectSnapshot | null = null;
        run('Поворот', () => {
          document.updateStair(sel.id, { rotationY });
          updated = document.getStair(sel.id)?.toSnapshot() ?? null;
        });
        if (updated) stairHooks.onStairUpsert?.(updated);
      }
    },
    setSelectedScale(scale) {
      const sel = selection.value;
      if (!sel) return;
      if (sel.type === 'shape') {
        run('Масштаб', () => document.setScale(sel.id, scale));
      } else if (sel.type === 'furniture') {
        run('Масштаб', () => document.setFurnitureTransform(sel.id, { scale }));
      }
    },
    setSelectedFurnitureSize(patch) {
      if (selection.value?.type !== 'furniture') return;
      const id = selection.value.id;
      run('Размер мебели', () => document.setFurnitureTransform(id, patch));
    },
    duplicateSelected() {
      const sel = selection.value;
      if (!sel) return;
      if (sel.type === 'shape') {
        run('Дублировать', () => document.duplicate(sel.id));
      } else if (sel.type === 'furniture') {
        run('Дублировать', () => document.duplicateFurniture(sel.id));
      } else if (sel.type === 'wall') {
        run('Дублировать', () => document.duplicateWall(sel.id));
      } else if (sel.type === 'opening') {
        run('Дублировать', () => document.duplicateOpening(sel.id));
      }
    },
    patchSettings(patch) {
      run('Настройки сцены', () => document.patchSettings(patch));
    },
    snapPoint(point, angleFrom = null) {
      return document.snapPoint(point, 0.35, angleFrom);
    },
    undo() {
      syncStairsAfterHistory(() => history.undo());
    },
    redo() {
      syncStairsAfterHistory(() => history.redo());
    },
    clearHistory() {
      history.clear();
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
        } else if (sel.type === 'furniture') {
          const item = document.getFurniture(sel.id);
          if (!item) return;
          document.moveFurniture(sel.id, item.position.x + dx, item.position.z + dz);
        } else if (sel.type === 'stair') {
          const stair = document.getStair(sel.id);
          if (!stair) return;
          document.moveStair(sel.id, stair.position.x + dx, stair.position.z + dz);
        }
      });
      if (sel.type === 'stair') {
        const snap = document.getStair(sel.id)?.toSnapshot();
        if (snap) stairHooks.onStairUpsert?.(snap);
      }
    },
    copySelected() {
      const sel = selection.value;
      if (!sel || sel.type === 'room' || sel.type === 'stair' || sel.type === 'dimension') return;
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
        } else if (src.kind === 'furniture') {
          const item = src.snapshot.furniture.find((f) => f.id === src.entityId);
          if (!item) return;
          document.addFurniture(item.catalogId, {
            position: { x: item.position.x + step, z: item.position.z + step },
            rotationY: item.rotationY,
            width: item.width,
            depth: item.depth,
            height: item.height,
            surface: item.surface,
            color: item.color,
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
