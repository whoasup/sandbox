import {
  createDefaultSceneSettings,
  resolveBackgroundColor,
  type DimensionLine,
  type FurnitureObject,
  type Opening,
  type Point2,
  type Room,
  type SceneObject,
  type SceneSettings,
  type SelectionRef,
  type StairObject,
  type WallObject,
} from '@sandbox/editor-core';
import type { EditorTool, ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { Svg2DDimensionView } from './Svg2DDimensionView';
import { Svg2DFurnitureView } from './Svg2DFurnitureView';
import { Svg2DStairView } from './Svg2DStairView';
import { Svg2DRoomView } from './Svg2DRoomView';
import { Svg2DShapeView } from './Svg2DShapeView';
import { Svg2DWallView } from './Svg2DWallView';
import { createSurfacePatternDefs } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PX_PER_UNIT = 46;
const MIN_WALL_LENGTH = 0.15;
const MIN_ROOM_SIZE = 0.5;

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
  private readonly roomsGroup: SVGGElement;
  private readonly shapesGroup: SVGGElement;
  private readonly furnitureGroup: SVGGElement;
  private readonly stairsGroup: SVGGElement;
  private readonly wallsGroup: SVGGElement;
  private readonly dimensionsGroup: SVGGElement;
  private readonly compassGroup: SVGGElement;
  private readonly overlayGroup: SVGGElement;
  private readonly shapeViews = new Map<string, Svg2DShapeView>();
  private readonly furnitureViews = new Map<string, Svg2DFurnitureView>();
  private readonly stairViews = new Map<string, Svg2DStairView>();
  private readonly wallViews = new Map<string, Svg2DWallView>();
  private readonly roomViews = new Map<string, Svg2DRoomView>();
  private readonly dimensionViews = new Map<string, Svg2DDimensionView>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
  private dragging:
    | { type: 'shape'; id: string }
    | { type: 'wall'; id: string }
    | { type: 'furniture'; id: string }
    | { type: 'stair'; id: string }
    | null = null;
  private wallDraftStart: Point2 | null = null;
  private roomDraftStart: Point2 | null = null;
  private rubberBand: SVGLineElement | null = null;
  private roomRubberBand: SVGRectElement | null = null;
  private snapMarker: SVGCircleElement | null = null;
  private tool: EditorTool = 'select';
  private latestObjects: readonly SceneObject[] = [];
  private latestWalls: readonly WallObject[] = [];
  private latestRooms: readonly Room[] = [];
  private latestOpenings: readonly Opening[] = [];
  private latestFurniture: readonly FurnitureObject[] = [];
  private latestStairs: readonly StairObject[] = [];
  private latestDimensions: readonly DimensionLine[] = [];
  private latestSelection: SelectionRef = null;
  private latestSettings: SceneSettings = createDefaultSceneSettings();
  private planStyle: 'clean' | 'draft' = 'clean';

  public constructor(private readonly interactions: RendererInteractionEvents = {}) {
    this.svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.svg.style.display = 'block';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.appendChild(createSurfacePatternDefs());

    this.fieldGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.gridGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.axesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.roomsGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.wallsGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.shapesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.furnitureGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.stairsGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.dimensionsGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.compassGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.overlayGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.svg.append(
      this.fieldGroup,
      this.gridGroup,
      this.axesGroup,
      this.roomsGroup,
      this.wallsGroup,
      this.shapesGroup,
      this.furnitureGroup,
      this.stairsGroup,
      this.dimensionsGroup,
      this.compassGroup,
      this.overlayGroup,
    );
  }

  public setTool(tool: EditorTool): void {
    this.tool = tool;
    if (tool !== 'wall' && tool !== 'dimension') this.cancelWallDraft();
    if (tool !== 'room') this.cancelRoomDraft();
    this.svg.style.cursor =
      tool === 'wall' ||
      tool === 'dimension' ||
      tool === 'door' ||
      tool === 'window' ||
      tool === 'stair' ||
      tool === 'room'
        ? 'crosshair'
        : '';
  }

  public setPlanStyle(style: 'clean' | 'draft'): void {
    this.planStyle = style;
    this.svg.setAttribute('data-plan-style', style);
    if (this.latestFurniture.length > 0 || this.furnitureViews.size > 0) {
      this.syncFurniture(this.latestFurniture, this.latestSelection);
    }
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
    this.svg.addEventListener('dblclick', this.handleDoubleClick);
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
    rooms: readonly Room[],
    openings: readonly Opening[],
    furniture: readonly FurnitureObject[],
    stairs: readonly StairObject[],
    dimensions: readonly DimensionLine[],
    selection: SelectionRef,
    settings: SceneSettings,
  ): void {
    this.latestObjects = objects;
    this.latestWalls = walls;
    this.latestRooms = rooms;
    this.latestOpenings = openings;
    this.latestFurniture = furniture;
    this.latestStairs = stairs;
    this.latestDimensions = dimensions;
    this.latestSelection = selection;
    this.latestSettings = settings;
    this.svg.style.backgroundColor = resolveBackgroundColor(settings.background);
    this.drawField(settings);
    this.drawGrid(settings);
    this.drawAxes(settings);
    this.syncRooms(rooms, selection, settings.field.roomAreasVisible);
    this.syncShapes(objects, selection);
    this.syncFurniture(furniture, selection);
    this.syncStairs(stairs, selection);
    this.syncWalls(walls, openings, selection, settings.field.wallLengthsVisible);
    this.syncDimensions(dimensions, selection);
    this.drawCompass(settings);
  }

  public dispose(): void {
    this.resizeObserver?.disconnect();
    this.svg.removeEventListener('pointerdown', this.handlePointerDown);
    this.svg.removeEventListener('pointermove', this.handlePointerMove);
    this.svg.removeEventListener('pointerup', this.handlePointerUp);
    this.svg.removeEventListener('pointerleave', this.handlePointerUp);
    this.svg.removeEventListener('keydown', this.handleKeyDown);
    this.svg.removeEventListener('dblclick', this.handleDoubleClick);
    this.shapeViews.clear();
    this.furnitureViews.clear();
    this.stairViews.clear();
    this.wallViews.clear();
    this.roomViews.clear();
    this.dimensionViews.clear();
    this.cancelWallDraft();
    this.cancelRoomDraft();
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

  private syncWalls(
    walls: readonly WallObject[],
    openings: readonly Opening[],
    selection: SelectionRef,
    showLength: boolean,
  ): void {
    const seen = new Set<string>();
    const selectedWallId = selection?.type === 'wall' ? selection.id : null;
    const selectedOpeningId = selection?.type === 'opening' ? selection.id : null;

    for (const wall of walls) {
      seen.add(wall.id);
      let view = this.wallViews.get(wall.id);
      if (!view) {
        view = new Svg2DWallView(wall);
        this.wallViews.set(wall.id, view);
        this.wallsGroup.appendChild(view.group);
      }
      const wallOpenings = openings.filter((o) => o.wallId === wall.id);
      view.update(
        wall,
        wallOpenings,
        PX_PER_UNIT,
        this.origin,
        wall.id === selectedWallId,
        selectedOpeningId,
        showLength,
      );
    }

    for (const [id, view] of this.wallViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.wallViews.delete(id);
    }
  }

  private syncFurniture(furniture: readonly FurnitureObject[], selection: SelectionRef): void {
    const seen = new Set<string>();
    const selectedId = selection?.type === 'furniture' ? selection.id : null;

    for (const item of furniture) {
      seen.add(item.id);
      let view = this.furnitureViews.get(item.id);
      if (!view) {
        view = new Svg2DFurnitureView(item);
        this.furnitureViews.set(item.id, view);
        this.furnitureGroup.appendChild(view.group);
      }
      view.update(item, PX_PER_UNIT, this.origin, item.id === selectedId, this.planStyle);
    }

    for (const [id, view] of this.furnitureViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.furnitureViews.delete(id);
    }
  }

  private syncStairs(stairs: readonly StairObject[], selection: SelectionRef): void {
    const seen = new Set<string>();
    const selectedId = selection?.type === 'stair' ? selection.id : null;

    for (const stair of stairs) {
      seen.add(stair.id);
      let view = this.stairViews.get(stair.id);
      if (!view) {
        view = new Svg2DStairView(stair);
        this.stairViews.set(stair.id, view);
        this.stairsGroup.appendChild(view.group);
      }
      view.update(stair, PX_PER_UNIT, this.origin, stair.id === selectedId);
    }

    for (const [id, view] of this.stairViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.stairViews.delete(id);
    }
  }

  private syncRooms(rooms: readonly Room[], selection: SelectionRef, showArea: boolean): void {
    const seen = new Set<string>();
    const selectedRoomId = selection?.type === 'room' ? selection.id : null;

    for (const room of rooms) {
      seen.add(room.id);
      let view = this.roomViews.get(room.id);
      if (!view) {
        view = new Svg2DRoomView(room);
        this.roomViews.set(room.id, view);
        this.roomsGroup.appendChild(view.group);
      }
      view.update(room, PX_PER_UNIT, this.origin, room.id === selectedRoomId, showArea);
    }

    for (const [id, view] of this.roomViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.roomViews.delete(id);
    }
  }

  private syncDimensions(dimensions: readonly DimensionLine[], selection: SelectionRef): void {
    const seen = new Set<string>();
    const selectedId = selection?.type === 'dimension' ? selection.id : null;

    for (const dim of dimensions) {
      seen.add(dim.id);
      let view = this.dimensionViews.get(dim.id);
      if (!view) {
        view = new Svg2DDimensionView(dim);
        this.dimensionViews.set(dim.id, view);
        this.dimensionsGroup.appendChild(view.group);
      }
      view.update(dim, PX_PER_UNIT, this.origin, dim.id === selectedId);
    }

    for (const [id, view] of this.dimensionViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.dimensionViews.delete(id);
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
    this.render(
      this.latestObjects,
      this.latestWalls,
      this.latestRooms,
      this.latestOpenings,
      this.latestFurniture,
      this.latestStairs,
      this.latestDimensions,
      this.latestSelection,
      this.latestSettings,
    );
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

  private drawCompass(settings: SceneSettings): void {
    this.compassGroup.replaceChildren();
    if (!settings.field.compassVisible) return;

    const cx = this.width - 36;
    const cy = 36;
    const r = 22;

    const bg = document.createElementNS(SVG_NS, 'circle');
    bg.setAttribute('cx', String(cx));
    bg.setAttribute('cy', String(cy));
    bg.setAttribute('r', String(r));
    bg.setAttribute('fill', 'rgba(255,255,255,0.92)');
    bg.setAttribute('stroke', '#9ca3af');
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('pointer-events', 'none');
    this.compassGroup.appendChild(bg);

    const needle = document.createElementNS(SVG_NS, 'polygon');
    needle.setAttribute('points', `${cx},${cy - r + 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`);
    needle.setAttribute('fill', '#e5484d');
    needle.setAttribute('pointer-events', 'none');
    this.compassGroup.appendChild(needle);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(cx));
    label.setAttribute('y', String(cy - r + 14));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '600');
    label.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
    label.setAttribute('fill', '#374151');
    label.setAttribute('pointer-events', 'none');
    label.textContent = 'N';
    this.compassGroup.appendChild(label);
  }

  private resolveSelectionFromEvent(event: MouseEvent): SelectionRef {
    const target = event.target as Element | null;
    const openingGroup = target?.closest<SVGGElement>('[data-opening-id]');
    if (openingGroup?.dataset.openingId) {
      return { type: 'opening', id: openingGroup.dataset.openingId };
    }
    const stairGroup = target?.closest<SVGGElement>('[data-stair-id]');
    if (stairGroup?.dataset.stairId) {
      return { type: 'stair', id: stairGroup.dataset.stairId };
    }
    const furnitureGroup = target?.closest<SVGGElement>('[data-furniture-id]');
    if (furnitureGroup?.dataset.furnitureId) {
      return { type: 'furniture', id: furnitureGroup.dataset.furnitureId };
    }
    const dimensionGroup = target?.closest<SVGGElement>('[data-dimension-id]');
    if (dimensionGroup?.dataset.dimensionId) {
      return { type: 'dimension', id: dimensionGroup.dataset.dimensionId };
    }
    const wallGroup = target?.closest<SVGGElement>('[data-wall-id]');
    if (wallGroup?.dataset.wallId) {
      return { type: 'wall', id: wallGroup.dataset.wallId };
    }
    const shapeGroup = target?.closest<SVGGElement>('[data-shape-id]');
    if (shapeGroup?.dataset.shapeId) {
      return { type: 'shape', id: shapeGroup.dataset.shapeId };
    }
    const roomGroup = target?.closest<SVGGElement>('[data-room-id]');
    if (roomGroup?.dataset.roomId) {
      return { type: 'room', id: roomGroup.dataset.roomId };
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
    const angleFrom =
      this.tool === 'wall' || this.tool === 'dimension' ? this.wallDraftStart : null;
    return this.interactions.snapPoint?.(point, angleFrom) ?? point;
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
    this.interactions.onWallDraftLength?.(null);
  }

  private ensureRoomRubberBand(): SVGRectElement {
    if (!this.roomRubberBand) {
      this.roomRubberBand = document.createElementNS(SVG_NS, 'rect');
      this.roomRubberBand.setAttribute('fill', 'rgba(59, 125, 237, 0.12)');
      this.roomRubberBand.setAttribute('stroke', '#3b7ded');
      this.roomRubberBand.setAttribute('stroke-width', '2');
      this.roomRubberBand.setAttribute('stroke-dasharray', '6 4');
      this.roomRubberBand.setAttribute('pointer-events', 'none');
      this.overlayGroup.appendChild(this.roomRubberBand);
    }
    return this.roomRubberBand;
  }

  private updateRoomRubberBand(start: Point2, end: Point2): void {
    const a = this.worldToPx(start);
    const b = this.worldToPx(end);
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    const band = this.ensureRoomRubberBand();
    band.setAttribute('x', String(x));
    band.setAttribute('y', String(y));
    band.setAttribute('width', String(w));
    band.setAttribute('height', String(h));
  }

  private cancelRoomDraft(): void {
    this.roomDraftStart = null;
    this.roomRubberBand?.remove();
    this.roomRubberBand = null;
    this.updateSnapMarker(null);
  }

  private commitRoomDraft(end: Point2): void {
    const start = this.roomDraftStart;
    this.cancelRoomDraft();
    if (!start) return;
    const width = end.x - start.x;
    const depth = end.z - start.z;
    if (Math.abs(width) < MIN_ROOM_SIZE || Math.abs(depth) < MIN_ROOM_SIZE) return;
    const origin = {
      x: Math.min(start.x, end.x),
      z: Math.min(start.z, end.z),
    };
    this.interactions.onAddRoomRect?.(origin, Math.abs(width), Math.abs(depth));
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.cancelWallDraft();
      this.cancelRoomDraft();
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.tool === 'door' || this.tool === 'window') {
      const point = this.snapWorld(this.eventToWorld(event));
      const wallHit = this.resolveSelectionFromEvent(event);
      const wallId = wallHit?.type === 'wall' ? wallHit.id : undefined;
      this.interactions.onAddOpening?.(this.tool, point, wallId);
      return;
    }

    if (this.tool === 'stair') {
      const point = this.snapWorld(this.eventToWorld(event));
      this.interactions.onAddStair?.(point);
      return;
    }

    if (this.tool === 'room') {
      const snapped = this.snapWorld(this.eventToWorld(event));
      if (this.interactions.onPlacePendingRoom?.(snapped)) {
        return;
      }
      if (!this.roomDraftStart) {
        this.roomDraftStart = snapped;
        this.updateSnapMarker(snapped);
        this.updateRoomRubberBand(snapped, snapped);
      } else {
        this.commitRoomDraft(snapped);
      }
      return;
    }

    if (this.tool === 'wall' || this.tool === 'dimension') {
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
          if (this.tool === 'wall') {
            this.interactions.onAddWall?.(start, end);
          } else {
            this.interactions.onAddDimension?.(start, end);
          }
        }
      }
      return;
    }

    const selection = this.resolveSelectionFromEvent(event);
    this.interactions.onSelect?.(selection);
    this.dragging =
      selection?.type === 'shape' ||
      selection?.type === 'wall' ||
      selection?.type === 'furniture' ||
      selection?.type === 'stair'
        ? selection
        : null;
    if (this.dragging) this.interactions.onMoveGestureStart?.();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.tool === 'room' && this.roomDraftStart) {
      const snapped = this.snapWorld(this.eventToWorld(event));
      this.updateSnapMarker(snapped);
      this.updateRoomRubberBand(this.roomDraftStart, snapped);
      return;
    }

    if ((this.tool === 'wall' || this.tool === 'dimension') && this.wallDraftStart) {
      const snapped = this.snapWorld(this.eventToWorld(event));
      this.updateSnapMarker(snapped);
      const band = this.ensureRubberBand();
      const startPx = this.worldToPx(this.wallDraftStart);
      const endPx = this.worldToPx(snapped);
      band.setAttribute('x1', String(startPx.x));
      band.setAttribute('y1', String(startPx.y));
      band.setAttribute('x2', String(endPx.x));
      band.setAttribute('y2', String(endPx.y));
      this.interactions.onWallDraftLength?.(
        Math.hypot(snapped.x - this.wallDraftStart.x, snapped.z - this.wallDraftStart.z),
      );
      return;
    }

    if (!this.dragging) return;
    const { x, z } = this.eventToWorld(event);
    if (this.dragging.type === 'shape') {
      this.interactions.onMoveShape?.(this.dragging.id, x, z);
    } else if (this.dragging.type === 'wall') {
      this.interactions.onMoveWall?.(this.dragging.id, x, z);
    } else if (this.dragging.type === 'furniture') {
      this.interactions.onMoveFurniture?.(this.dragging.id, x, z);
    } else {
      this.interactions.onMoveStair?.(this.dragging.id, x, z);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.tool === 'room' && this.roomDraftStart && event.type === 'pointerup') {
      const snapped = this.snapWorld(this.eventToWorld(event));
      // Drag-to-commit: only if the pointer moved enough from the start corner.
      const dx = Math.abs(snapped.x - this.roomDraftStart.x);
      const dz = Math.abs(snapped.z - this.roomDraftStart.z);
      if (dx >= MIN_ROOM_SIZE || dz >= MIN_ROOM_SIZE) {
        this.commitRoomDraft(snapped);
        return;
      }
      // Click-click mode: keep start and wait for a second click.
    }

    if (this.dragging) this.interactions.onMoveGestureEnd?.();
    this.dragging = null;
  };

  private readonly handleDoubleClick = (event: MouseEvent): void => {
    const selection = this.resolveSelectionFromEvent(event);
    if (selection?.type === 'stair') {
      this.interactions.onActivateStair?.(selection.id);
    }
  };
}
