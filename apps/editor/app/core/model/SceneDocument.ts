import { EventEmitter } from '@sandbox/ui-kit';
import { ShapeFactory } from './ShapeFactory';
import type { SceneObject } from './SceneObject';
import type { SceneObjectInit, ShapeKind, SurfaceKind } from './types';

// A type literal (not an `interface`) so it structurally satisfies the
// `EventMap` (`Record<string, unknown>`) constraint on `EventEmitter`.
export type SceneDocumentEvents = {
  change: SceneObject[];
  select: string | null;
};

/**
 * The single source of truth for the editor: a flat collection of
 * `SceneObject`s plus a selection cursor. Both the 2D (`SvgRenderer`) and
 * 3D (`ThreeRenderer`) views subscribe to the same document, so switching
 * modes never loses state — only the active renderer changes.
 */
export class SceneDocument extends EventEmitter<SceneDocumentEvents> {
  private readonly objects = new Map<string, SceneObject>();
  private selectedId: string | null = null;

  public list(): SceneObject[] {
    return [...this.objects.values()];
  }

  public get(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }

  public get selected(): SceneObject | null {
    return this.selectedId ? (this.objects.get(this.selectedId) ?? null) : null;
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
    shape.moveTo(x, z);
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

  public clear(): void {
    this.objects.clear();
    this.select(null);
    this.notifyChange();
  }

  private notifyChange(): void {
    this.emit('change', this.list());
  }
}
