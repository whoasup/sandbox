import type { InjectionKey, ShallowRef } from 'vue';
import { inject, provide, shallowRef } from 'vue';
import type { ShapeKind, SurfaceKind } from '@sandbox/ui-kit';
import { SceneDocument } from '../core/model/SceneDocument';
import type { SceneObject } from '../core/model/SceneObject';

export type EditorMode = '2d' | '3d';

const PLACEMENT_RADIUS = 2.2;

export interface EditorDocumentContext {
  document: SceneDocument;
  objects: ShallowRef<SceneObject[]>;
  selectedId: ShallowRef<string | null>;
  mode: ShallowRef<EditorMode>;
  activeSurface: ShallowRef<SurfaceKind>;
  activeColor: ShallowRef<string>;
  addShape: (kind: ShapeKind) => void;
  removeSelected: () => void;
  applySurfaceToSelection: (surface: SurfaceKind) => void;
  applyColorToSelection: (color: string) => void;
  selectShape: (id: string | null) => void;
  moveShape: (id: string, x: number, z: number) => void;
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
  const selectedId = shallowRef<string | null>(null);
  const mode = shallowRef<EditorMode>('3d');
  const activeSurface = shallowRef<SurfaceKind>('wood');
  const activeColor = shallowRef<string>('#c9945f');

  document.on('change', (list) => {
    objects.value = list;
  });
  document.on('select', (id) => {
    selectedId.value = id;
    const shape = id ? document.get(id) : undefined;
    if (shape) {
      activeSurface.value = shape.surface;
      activeColor.value = shape.color;
    }
  });

  const context: EditorDocumentContext = {
    document,
    objects,
    selectedId,
    mode,
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
    removeSelected() {
      document.removeSelected();
    },
    applySurfaceToSelection(surface) {
      activeSurface.value = surface;
      if (selectedId.value) document.setSurface(selectedId.value, surface);
    },
    applyColorToSelection(color) {
      activeColor.value = color;
      if (selectedId.value) document.setColor(selectedId.value, color);
    },
    selectShape(id) {
      document.select(id);
    },
    moveShape(id, x, z) {
      document.moveShape(id, x, z);
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
