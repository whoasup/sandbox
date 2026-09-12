import type { WallObject } from '../../model/WallObject';
import { patternIdFor } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Top-down thick-line representation of a wall segment in the 2D plan view.
 */
export class Svg2DWallView {
  public readonly group: SVGGElement;
  private readonly outline: SVGLineElement;
  private readonly base: SVGLineElement;
  private readonly overlay: SVGLineElement;

  public constructor(wall: WallObject) {
    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.wallId = wall.id;
    this.group.style.cursor = 'grab';

    this.outline = document.createElementNS(SVG_NS, 'line');
    this.outline.setAttribute('stroke-linecap', 'butt');
    this.outline.setAttribute('pointer-events', 'none');
    this.outline.setAttribute('stroke', '#3b7ded');

    this.base = document.createElementNS(SVG_NS, 'line');
    this.base.setAttribute('stroke-linecap', 'butt');

    this.overlay = document.createElementNS(SVG_NS, 'line');
    this.overlay.setAttribute('stroke-linecap', 'butt');
    this.overlay.setAttribute('pointer-events', 'none');
    this.overlay.setAttribute('opacity', '0.75');
    this.overlay.style.mixBlendMode = 'multiply';

    this.group.append(this.outline, this.base, this.overlay);
  }

  public update(
    wall: WallObject,
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
  ): void {
    const x1 = originPx.x + wall.start.x * pxPerUnit;
    const y1 = originPx.y + wall.start.z * pxPerUnit;
    const x2 = originPx.x + wall.end.x * pxPerUnit;
    const y2 = originPx.y + wall.end.z * pxPerUnit;
    const strokeWidth = Math.max(wall.thickness * pxPerUnit, 3);

    for (const el of [this.outline, this.base, this.overlay]) {
      el.setAttribute('x1', String(x1));
      el.setAttribute('y1', String(y1));
      el.setAttribute('x2', String(x2));
      el.setAttribute('y2', String(y2));
    }

    this.outline.setAttribute('stroke-width', String(strokeWidth + 4));
    this.outline.setAttribute('opacity', selected ? '1' : '0');

    this.base.setAttribute('stroke-width', String(strokeWidth));
    this.base.setAttribute('stroke', wall.color);

    this.overlay.setAttribute('stroke-width', String(strokeWidth));
    this.overlay.setAttribute('stroke', `url(#${patternIdFor(wall.surface)})`);
  }
}
