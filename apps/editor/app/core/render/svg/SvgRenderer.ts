import type { SceneObject } from '../../model/SceneObject';
import type { ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { Svg2DShapeView } from './Svg2DShapeView';
import { createSurfacePatternDefs } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PX_PER_UNIT = 46;
const GRID_STEP_UNITS = 1;

/**
 * OOP wrapper around a top-down SVG scene. Structurally mirrors
 * `ThreeRenderer` (`mount` / `render` / `dispose`) but draws a floor-plan
 * style view instead of a perspective one — the planner5d-style "2D mode".
 */
export class SvgRenderer implements ISceneRenderer {
  private readonly svg: SVGSVGElement;
  private readonly gridGroup: SVGGElement;
  private readonly shapesGroup: SVGGElement;
  private readonly shapeViews = new Map<string, Svg2DShapeView>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
  private draggingId: string | null = null;
  private latestObjects: readonly SceneObject[] = [];
  private latestSelectedId: string | null = null;

  public constructor(private readonly interactions: RendererInteractionEvents = {}) {
    this.svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.svg.style.display = 'block';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.backgroundColor = '#eceef1';
    this.svg.appendChild(createSurfacePatternDefs());

    this.gridGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.shapesGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.svg.append(this.gridGroup, this.shapesGroup);
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

  public render(objects: readonly SceneObject[], selectedId: string | null): void {
    this.latestObjects = objects;
    this.latestSelectedId = selectedId;
    const seen = new Set<string>();

    for (const object of objects) {
      seen.add(object.id);
      let view = this.shapeViews.get(object.id);
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
    this.drawGrid();
    this.render(this.latestObjects, this.latestSelectedId);
  }

  private drawGrid(): void {
    this.gridGroup.replaceChildren();
    const stepPx = PX_PER_UNIT * GRID_STEP_UNITS;
    const { x: originX, y: originY } = this.origin;

    for (let x = originX % stepPx; x <= this.width; x += stepPx) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(this.height));
      line.setAttribute('stroke', '#d7dbe0');
      line.setAttribute('stroke-width', '1');
      this.gridGroup.appendChild(line);
    }
    for (let y = originY % stepPx; y <= this.height; y += stepPx) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', String(this.width));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#d7dbe0');
      line.setAttribute('stroke-width', '1');
      this.gridGroup.appendChild(line);
    }
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
