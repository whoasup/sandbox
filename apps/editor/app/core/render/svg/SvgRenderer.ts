import type { SceneObject } from '../../model/SceneObject';
import {
  createDefaultSceneSettings,
  resolveBackgroundColor,
  type SceneSettings,
} from '../../model/SceneSettings';
import type { ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { Svg2DShapeView } from './Svg2DShapeView';
import { createSurfacePatternDefs } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PX_PER_UNIT = 46;

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
  private readonly shapeViews = new Map<string, Svg2DShapeView>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
  private draggingId: string | null = null;
  private latestObjects: readonly SceneObject[] = [];
  private latestSelectedId: string | null = null;
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
    this.shapesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.svg.append(this.fieldGroup, this.gridGroup, this.axesGroup, this.shapesGroup);
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

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      this.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(container);
  }

  public render(
    objects: readonly SceneObject[],
    selectedId: string | null,
    settings: SceneSettings,
  ): void {
    this.latestObjects = objects;
    this.latestSelectedId = selectedId;
    this.latestSettings = settings;
    this.svg.style.backgroundColor = resolveBackgroundColor(settings.background);
    this.drawField(settings);
    this.drawGrid(settings);
    this.drawAxes(settings);

    const seen = new Set<string>();

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
      view.update(object, PX_PER_UNIT, this.origin, object.id === selectedId);
    }

    for (const [id, view] of this.shapeViews) {
      if (seen.has(id)) continue;
      view.group.remove();
      this.shapeViews.delete(id);
    }
  }

  public dispose(): void {
    this.resizeObserver?.disconnect();
    this.svg.removeEventListener('pointerdown', this.handlePointerDown);
    this.svg.removeEventListener('pointermove', this.handlePointerMove);
    this.svg.removeEventListener('pointerup', this.handlePointerUp);
    this.svg.removeEventListener('pointerleave', this.handlePointerUp);
    this.shapeViews.clear();
    this.svg.remove();
    this.container = null;
  }

  private get origin(): { x: number; y: number } {
    return { x: this.width / 2, y: this.height / 2 };
  }

  private resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.render(this.latestObjects, this.latestSelectedId, this.latestSettings);
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

  private resolveShapeIdFromEvent(event: PointerEvent): string | null {
    const target = event.target as Element | null;
    const group = target?.closest<SVGGElement>('[data-shape-id]');
    return group?.dataset.shapeId ?? null;
  }

  private eventToWorld(event: PointerEvent): { x: number; z: number } {
    const rect = this.svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    return {
      x: (px - this.origin.x) / PX_PER_UNIT,
      z: (py - this.origin.y) / PX_PER_UNIT,
    };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const id = this.resolveShapeIdFromEvent(event);
    this.interactions.onSelect?.(id);
    this.draggingId = id;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.draggingId) return;
    const { x, z } = this.eventToWorld(event);
    this.interactions.onMove?.(this.draggingId, x, z);
  };

  private readonly handlePointerUp = (): void => {
    this.draggingId = null;
  };
}
