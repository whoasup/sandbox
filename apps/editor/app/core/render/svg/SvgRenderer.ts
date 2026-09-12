import type { SceneObject } from '../../model/SceneObject';
import {
  createDefaultSceneSettings,
  resolveBackgroundColor,
  type SceneSettings,
} from '../../model/SceneSettings';
import type { SelectionRef } from '../../model/types';
import type { Point2, WallObject } from '../../model/WallObject';
import type { EditorTool, ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { Svg2DShapeView } from './Svg2DShapeView';
import { Svg2DWallView } from './Svg2DWallView';
import { createSurfacePatternDefs } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PX_PER_UNIT = 46;
const MIN_WALL_LENGTH = 0.15;

/**
 * OOP wrapper around a top-down SVG scene. Structurally mirrors
 * `ThreeRenderer` (`mount` / `render` / `dispose`) but draws a floor-plan
 * style view instead of a perspective one — the planner5d-style "2D mode".
 */
export class SvgRenderer implements ISceneRenderer {
  private readonly svg: SVGSVGElement;
  private readonly fieldGroup: SVGGElement;
  private readonly gridGroup: SVGGElement;
  private readonly axesGroup: SVGGElement;
  private readonly shapesGroup: SVGGElement;
  private readonly wallsGroup: SVGGElement;
  private readonly overlayGroup: SVGGElement;
  private readonly shapeViews = new Map<string, Svg2DShapeView>();
  private readonly wallViews = new Map<string, Svg2DWallView>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
  private dragging: { type: 'shape'; id: string } | { type: 'wall'; id: string } | null = null;
  private wallDraftStart: Point2 | null = null;
  private rubberBand: SVGLineElement | null = null;
  private snapMarker: SVGCircleElement | null = null;
  private tool: EditorTool = 'select';
  private latestObjects: readonly SceneObject[] = [];
  private latestWalls: readonly WallObject[] = [];
  private latestSelection: SelectionRef = null;
  private latestSettings: SceneSettings = createDefaultSceneSettings();

  public constructor(private readonly interactions: RendererInteractionEvents = {}) {
    this.svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.svg.style.display = 'block';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.appendChild(createSurfacePatternDefs());

    this.fieldGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.gridGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.axesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.wallsGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.shapesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.overlayGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.svg.append(
      this.fieldGroup,
      this.gridGroup,
      this.axesGroup,
      this.wallsGroup,
      this.shapesGroup,
      this.overlayGroup,
    );
  }

  public setTool(tool: EditorTool): void {
    this.tool = tool;
    if (tool !== 'wall') this.cancelWallDraft();
    this.svg.style.cursor = tool === 'wall' ? 'crosshair' : '';
  }

  public mount(container: HTMLElement): void {
    if (this.container) {
      throw new Error('SvgRenderer is already mounted; call dispose() before mounting again.');
    }
    this.container = container;
    container.appendChild(this.svg);
    this.resize(container.clientWidth, container.clientHeight);

    this.svg.addEventListener('pointerdown', this.handlePointerDown);
    this.svg.addEventListener('pointermove', this.handlePointerMove);
    this.svg.addEventListener('pointerup', this.handlePointerUp);
    this.svg.addEventListener('pointerleave', this.handlePointerUp);
    this.svg.addEventListener('keydown', this.handleKeyDown);
    this.svg.setAttribute('tabindex', '0');

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      this.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(container);
  }

  public render(
    objects: readonly SceneObject[],
    walls: readonly WallObject[],
    selection: SelectionRef,
    settings: SceneSettings,
  ): void {
    this.latestObjects = objects;
    this.latestWalls = walls;
    this.latestSelection = selection;
    this.latestSettings = settings;
    this.svg.style.backgroundColor = resolveBackgroundColor(settings.background);
    this.drawField(settings);
    this.drawGrid(settings);
    this.drawAxes(settings);
    this.syncShapes(objects, selection);
    this.syncWalls(walls, selection);
  }

  public dispose(): void {
    this.resizeObserver?.disconnect();
    this.svg.removeEventListener('pointerdown', this.handlePointerDown);
    this.svg.removeEventListener('pointermove', this.handlePointerMove);
    this.svg.removeEventListener('pointerup', this.handlePointerUp);
    this.svg.removeEventListener('pointerleave', this.handlePointerUp);
    this.svg.removeEventListener('keydown', this.handleKeyDown);
    this.shapeViews.clear();
    this.wallViews.clear();
    this.cancelWallDraft();
    this.svg.remove();
    this.container = null;
  }

  private syncShapes(objects: readonly SceneObject[], selection: SelectionRef): void {
    const seen = new Set<string>();
    const selectedShapeId = selection?.type === 'shape' ? selection.id : null;

    for (const object of objects) {
      seen.add(object.id);
      let view = this.shapeViews.get(object.id);
      if (view && view.kind !== object.kind) {
        view.group.remove();
        this.shapeViews.delete(object.id);
        view = undefined;
      }
      if (!view) {
        view = new Svg2DShapeView(object);
        this.shapeViews.set(object.id, view);
        this.shapesGroup.appendChild(view.group);
      }
      view.update(object, PX_PER_UNIT, this.origin, object.id === selectedShapeId);
    }

    for (const [id, view] of this.shapeViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.shapeViews.delete(id);
    }
  }

  private syncWalls(walls: readonly WallObject[], selection: SelectionRef): void {
    const seen = new Set<string>();
    const selectedWallId = selection?.type === 'wall' ? selection.id : null;

    for (const wall of walls) {
      seen.add(wall.id);
      let view = this.wallViews.get(wall.id);
      if (!view) {
        view = new Svg2DWallView(wall);
        this.wallViews.set(wall.id, view);
        this.wallsGroup.appendChild(view.group);
      }
      view.update(wall, PX_PER_UNIT, this.origin, wall.id === selectedWallId);
    }

    for (const [id, view] of this.wallViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.wallViews.delete(id);
    }
  }

  private get origin(): { x: number; y: number } {
    return { x: this.width / 2, y: this.height / 2 };
  }

  private resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.render(this.latestObjects, this.latestWalls, this.latestSelection, this.latestSettings);
  }

  private drawField(settings: SceneSettings): void {
    this.fieldGroup.replaceChildren();
    const { width, depth } = settings.field;
    const { x: ox, y: oy } = this.origin;
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(ox - (width * PX_PER_UNIT) / 2));
    rect.setAttribute('y', String(oy - (depth * PX_PER_UNIT) / 2));
    rect.setAttribute('width', String(width * PX_PER_UNIT));
    rect.setAttribute('height', String(depth * PX_PER_UNIT));
    rect.setAttribute('fill', settings.floor.color);
    rect.setAttribute('opacity', '0.55');
    this.fieldGroup.appendChild(rect);
  }

  private drawGrid(settings: SceneSettings): void {
    this.gridGroup.replaceChildren();
    if (!settings.field.gridVisible) return;

    const step = Math.max(settings.field.gridStep, 0.1);
    const stepPx = PX_PER_UNIT * step;
    const { x: originX, y: originY } = this.origin;
    const halfW = (settings.field.width * PX_PER_UNIT) / 2;
    const halfD = (settings.field.depth * PX_PER_UNIT) / 2;
    const minX = originX - halfW;
    const maxX = originX + halfW;
    const minY = originY - halfD;
    const maxY = originY + halfD;

    for (let x = originX; x <= maxX + 0.01; x += stepPx) {
      this.appendGridLine(x, minY, x, maxY);
    }
    for (let x = originX - stepPx; x >= minX - 0.01; x -= stepPx) {
      this.appendGridLine(x, minY, x, maxY);
    }
    for (let y = originY; y <= maxY + 0.01; y += stepPx) {
      this.appendGridLine(minX, y, maxX, y);
    }
    for (let y = originY - stepPx; y >= minY - 0.01; y -= stepPx) {
      this.appendGridLine(minX, y, maxX, y);
    }
  }

  private appendGridLine(x1: number, y1: number, x2: number, y2: number): void {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', '#b7bfc9');
    line.setAttribute('stroke-width', '1');
    this.gridGroup.appendChild(line);
  }

  private drawAxes(settings: SceneSettings): void {
    this.axesGroup.replaceChildren();
    if (!settings.field.axesVisible) return;
    const { x: ox, y: oy } = this.origin;
    const axisLen = Math.min(settings.field.width, settings.field.depth) * PX_PER_UNIT * 0.45;

    const xAxis = document.createElementNS(SVG_NS, 'line');
    xAxis.setAttribute('x1', String(ox));
    xAxis.setAttribute('y1', String(oy));
    xAxis.setAttribute('x2', String(ox + axisLen));
    xAxis.setAttribute('y2', String(oy));
    xAxis.setAttribute('stroke', '#e5484d');
    xAxis.setAttribute('stroke-width', '2');
    this.axesGroup.appendChild(xAxis);

    const zAxis = document.createElementNS(SVG_NS, 'line');
    zAxis.setAttribute('x1', String(ox));
    zAxis.setAttribute('y1', String(oy));
    zAxis.setAttribute('x2', String(ox));
    zAxis.setAttribute('y2', String(oy + axisLen));
    zAxis.setAttribute('stroke', '#3b7ded');
    zAxis.setAttribute('stroke-width', '2');
    this.axesGroup.appendChild(zAxis);
  }

  private resolveSelectionFromEvent(event: PointerEvent): SelectionRef {
    const target = event.target as Element | null;
    const wallGroup = target?.closest<SVGGElement>('[data-wall-id]');
    if (wallGroup?.dataset.wallId) {
      return { type: 'wall', id: wallGroup.dataset.wallId };
    }
    const shapeGroup = target?.closest<SVGGElement>('[data-shape-id]');
    if (shapeGroup?.dataset.shapeId) {
      return { type: 'shape', id: shapeGroup.dataset.shapeId };
    }
    return null;
  }

  private eventToWorld(event: PointerEvent): Point2 {
    const rect = this.svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    return {
      x: (px - this.origin.x) / PX_PER_UNIT,
      z: (py - this.origin.y) / PX_PER_UNIT,
    };
  }

  private snapWorld(point: Point2): Point2 {
    return this.interactions.snapPoint?.(point) ?? point;
  }

  private worldToPx(point: Point2): { x: number; y: number } {
    return {
      x: this.origin.x + point.x * PX_PER_UNIT,
      y: this.origin.y + point.z * PX_PER_UNIT,
    };
  }

  private ensureRubberBand(): SVGLineElement {
    if (!this.rubberBand) {
      this.rubberBand = document.createElementNS(SVG_NS, 'line');
      this.rubberBand.setAttribute('stroke', '#3b7ded');
      this.rubberBand.setAttribute('stroke-width', '3');
      this.rubberBand.setAttribute('stroke-dasharray', '6 4');
      this.rubberBand.setAttribute('pointer-events', 'none');
      this.overlayGroup.appendChild(this.rubberBand);
    }
    return this.rubberBand;
  }

  private ensureSnapMarker(): SVGCircleElement {
    if (!this.snapMarker) {
      this.snapMarker = document.createElementNS(SVG_NS, 'circle');
      this.snapMarker.setAttribute('r', '5');
      this.snapMarker.setAttribute('fill', '#3b7ded');
      this.snapMarker.setAttribute('pointer-events', 'none');
      this.overlayGroup.appendChild(this.snapMarker);
    }
    return this.snapMarker;
  }

  private updateSnapMarker(point: Point2 | null): void {
    if (!point) {
      this.snapMarker?.remove();
      this.snapMarker = null;
      return;
    }
    const marker = this.ensureSnapMarker();
    const px = this.worldToPx(point);
    marker.setAttribute('cx', String(px.x));
    marker.setAttribute('cy', String(px.y));
  }

  private cancelWallDraft(): void {
    this.wallDraftStart = null;
    this.rubberBand?.remove();
    this.rubberBand = null;
    this.updateSnapMarker(null);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.cancelWallDraft();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.tool === 'wall') {
      const snapped = this.snapWorld(this.eventToWorld(event));
      if (!this.wallDraftStart) {
        this.wallDraftStart = snapped;
        this.updateSnapMarker(snapped);
        const band = this.ensureRubberBand();
        const px = this.worldToPx(snapped);
        band.setAttribute('x1', String(px.x));
        band.setAttribute('y1', String(px.y));
        band.setAttribute('x2', String(px.x));
        band.setAttribute('y2', String(px.y));
      } else {
        const start = this.wallDraftStart;
        const end = snapped;
        this.cancelWallDraft();
        if (Math.hypot(end.x - start.x, end.z - start.z) >= MIN_WALL_LENGTH) {
          this.interactions.onAddWall?.(start, end);
        }
      }
      return;
    }

    const selection = this.resolveSelectionFromEvent(event);
    this.interactions.onSelect?.(selection);
    this.dragging = selection;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.tool === 'wall' && this.wallDraftStart) {
      const snapped = this.snapWorld(this.eventToWorld(event));
      this.updateSnapMarker(snapped);
      const band = this.ensureRubberBand();
      const startPx = this.worldToPx(this.wallDraftStart);
      const endPx = this.worldToPx(snapped);
      band.setAttribute('x1', String(startPx.x));
      band.setAttribute('y1', String(startPx.y));
      band.setAttribute('x2', String(endPx.x));
      band.setAttribute('y2', String(endPx.y));
      return;
    }

    if (!this.dragging) return;
    const { x, z } = this.eventToWorld(event);
    if (this.dragging.type === 'shape') {
      this.interactions.onMoveShape?.(this.dragging.id, x, z);
    } else {
      this.interactions.onMoveWall?.(this.dragging.id, x, z);
    }
  };

  private readonly handlePointerUp = (): void => {
    this.dragging = null;
  };
}
