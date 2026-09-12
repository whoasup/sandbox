import { EventEmitter } from '@sandbox/ui-kit';
import { ShapeFactory } from './ShapeFactory';
import type { SceneObject } from './SceneObject';
import {
  cloneSceneSettings,
  createDefaultSceneSettings,
  mergeSceneSettings,
  roundToStep,
  type SceneSettings,
  type SceneSettingsPatch,
} from './SceneSettings';
import type { SceneObjectInit, SceneSnapshot, ShapeKind, SurfaceKind } from './types';

// A type literal (not an `interface`) so it structurally satisfies the
// `EventMap` (`Record<string, unknown>`) constraint on `EventEmitter`.
export type SceneDocumentEvents = {
  change: SceneObject[];
  select: string | null;
  settings: SceneSettings;
};

/**
 * The single source of truth for the editor: a flat collection of
 * `SceneObject`s, document-level `SceneSettings`, plus a selection cursor.
 * Both the 2D (`SvgRenderer`) and 3D (`ThreeRenderer`) views subscribe to
 * the same document, so switching modes never loses state — only the
 * active renderer changes.
 */
export class SceneDocument extends EventEmitter<SceneDocumentEvents> {
  private readonly objects = new Map<string, SceneObject>();
  private selectedId: string | null = null;
  private sceneSettings: SceneSettings = createDefaultSceneSettings();

  public list(): SceneObject[] {
    return [...this.objects.values()];
  }

  public get(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }

  public get selected(): SceneObject | null {
    return this.selectedId ? (this.objects.get(this.selectedId) ?? null) : null;
  }

  public get settings(): SceneSettings {
    return cloneSceneSettings(this.sceneSettings);
  }

  public addShape(kind: ShapeKind, init?: SceneObjectInit): SceneObject {
    const shape = ShapeFactory.create(kind, init);
    this.objects.set(shape.id, shape);
    this.select(shape.id);
    this.notifyChange();
    return shape;
  }

  public remove(id: string): void {
    if (!this.objects.delete(id)) return;
    if (this.selectedId === id) this.select(null);
    this.notifyChange();
  }

  public removeSelected(): void {
    if (this.selectedId) this.remove(this.selectedId);
  }

  public select(id: string | null): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.emit('select', id);
  }

  public moveShape(id: string, x: number, z: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    const { snap, gridStep } = this.sceneSettings.field;
    const nextX = snap ? roundToStep(x, gridStep) : x;
    const nextZ = snap ? roundToStep(z, gridStep) : z;
    shape.moveTo(nextX, nextZ);
    this.notifyChange();
  }

  public setSurface(id: string, surface: SurfaceKind): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setSurface(surface);
    this.notifyChange();
  }

  public setColor(id: string, color: string): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setColor(color);
    this.notifyChange();
  }

  /**
   * Swap the concrete shape class while preserving id + transform +
   * material. Unsupported kinds throw (caller / UI must filter the catalog).
   */
  public replaceKind(id: string, kind: ShapeKind): SceneObject {
    if (!ShapeFactory.supports(kind)) {
      throw new Error(`SceneDocument.replaceKind: unsupported kind "${kind}"`);
    }
    const existing = this.objects.get(id);
    if (!existing) {
      throw new Error(`SceneDocument.replaceKind: unknown id "${id}"`);
    }
    if (existing.kind === kind) return existing;

    const snapshot = existing.toSnapshot();
    const replacement = ShapeFactory.create(kind, {
      id: snapshot.id,
      position: { x: snapshot.position.x, z: snapshot.position.z },
      rotationY: snapshot.rotationY,
      scale: snapshot.scale,
      surface: snapshot.surface,
      color: snapshot.color,
    });
    this.objects.set(id, replacement);
    this.select(id);
    this.notifyChange();
    return replacement;
  }

  public setRotationY(id: string, rotationY: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setRotationY(rotationY);
    this.notifyChange();
  }

  public setScale(id: string, scale: number): void {
    const shape = this.objects.get(id);
    if (!shape) return;
    shape.setScale(scale);
    this.notifyChange();
  }

  public duplicate(id: string): SceneObject | null {
    const source = this.objects.get(id);
    if (!source) return null;
    const snap = source.toSnapshot();
    const clone = this.addShape(snap.kind, {
      position: { x: snap.position.x + 1.2, z: snap.position.z + 1.2 },
      rotationY: snap.rotationY,
      scale: snap.scale,
      surface: snap.surface,
      color: snap.color,
    });
    return clone;
  }

  public patchSettings(patch: SceneSettingsPatch): void {
    this.sceneSettings = mergeSceneSettings(this.sceneSettings, patch);
    this.emit('settings', this.settings);
  }

  public updateSettings(next: SceneSettings): void {
    this.sceneSettings = cloneSceneSettings(next);
    this.emit('settings', this.settings);
  }

  public toSnapshot(): SceneSnapshot {
    return {
      objects: this.list().map((object) => object.toSnapshot()),
      settings: this.settings,
    };
  }

  public clear(): void {
    this.objects.clear();
    this.select(null);
    this.notifyChange();
  }

  private notifyChange(): void {
    this.emit('change', this.list());
  }
}
