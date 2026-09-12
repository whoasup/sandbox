import { openingSpanOnWall, solidWallIntervals } from '@sandbox/editor-core';
import type { Opening, WallObject } from '@sandbox/editor-core';
import { patternIdFor } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Top-down thick-line representation of a wall segment with opening gaps
 * and door/window symbols.
 */
export class Svg2DWallView {
  public readonly group: SVGGElement;
  private readonly segmentsGroup: SVGGElement;
  private readonly openingsGroup: SVGGElement;
  private readonly selectionOutline: SVGLineElement;

  public constructor(wall: WallObject) {
    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.wallId = wall.id;
    this.group.style.cursor = 'grab';

    this.selectionOutline = document.createElementNS(SVG_NS, 'line');
    this.selectionOutline.setAttribute('stroke-linecap', 'butt');
    this.selectionOutline.setAttribute('pointer-events', 'none');
    this.selectionOutline.setAttribute('stroke', '#3b7ded');

    this.segmentsGroup = document.createElementNS(SVG_NS, 'g');
    this.openingsGroup = document.createElementNS(SVG_NS, 'g');

    this.group.append(this.selectionOutline, this.segmentsGroup, this.openingsGroup);
  }

  public update(
    wall: WallObject,
    openings: readonly Opening[],
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
    selectedOpeningId: string | null,
  ): void {
    this.group.dataset.wallId = wall.id;
    const x1 = originPx.x + wall.start.x * pxPerUnit;
    const y1 = originPx.y + wall.start.z * pxPerUnit;
    const x2 = originPx.x + wall.end.x * pxPerUnit;
    const y2 = originPx.y + wall.end.z * pxPerUnit;
    const strokeWidth = Math.max(wall.thickness * pxPerUnit, 3);

    this.selectionOutline.setAttribute('x1', String(x1));
    this.selectionOutline.setAttribute('y1', String(y1));
    this.selectionOutline.setAttribute('x2', String(x2));
    this.selectionOutline.setAttribute('y2', String(y2));
    this.selectionOutline.setAttribute('stroke-width', String(strokeWidth + 4));
    this.selectionOutline.setAttribute('opacity', selected ? '1' : '0');

    this.segmentsGroup.replaceChildren();
    const solids = solidWallIntervals(wall.length, openings);
    for (const span of solids) {
      const ax = wall.start.x + (wall.end.x - wall.start.x) * span.t0;
      const az = wall.start.z + (wall.end.z - wall.start.z) * span.t0;
      const bx = wall.start.x + (wall.end.x - wall.start.x) * span.t1;
      const bz = wall.start.z + (wall.end.z - wall.start.z) * span.t1;
      const sx1 = originPx.x + ax * pxPerUnit;
      const sy1 = originPx.y + az * pxPerUnit;
      const sx2 = originPx.x + bx * pxPerUnit;
      const sy2 = originPx.y + bz * pxPerUnit;

      const base = document.createElementNS(SVG_NS, 'line');
      base.setAttribute('x1', String(sx1));
      base.setAttribute('y1', String(sy1));
      base.setAttribute('x2', String(sx2));
      base.setAttribute('y2', String(sy2));
      base.setAttribute('stroke-width', String(strokeWidth));
      base.setAttribute('stroke', wall.color);
      base.setAttribute('stroke-linecap', 'butt');

      const overlay = document.createElementNS(SVG_NS, 'line');
      overlay.setAttribute('x1', String(sx1));
      overlay.setAttribute('y1', String(sy1));
      overlay.setAttribute('x2', String(sx2));
      overlay.setAttribute('y2', String(sy2));
      overlay.setAttribute('stroke-width', String(strokeWidth));
      overlay.setAttribute('stroke', `url(#${patternIdFor(wall.surface)})`);
      overlay.setAttribute('stroke-linecap', 'butt');
      overlay.setAttribute('pointer-events', 'none');
      overlay.setAttribute('opacity', '0.75');
      overlay.style.mixBlendMode = 'multiply';

      this.segmentsGroup.append(base, overlay);
    }

    this.openingsGroup.replaceChildren();
    for (const opening of openings) {
      const span = openingSpanOnWall(wall.start, wall.end, opening.t, opening.width);
      const ox1 = originPx.x + span.a.x * pxPerUnit;
      const oy1 = originPx.y + span.a.z * pxPerUnit;
      const ox2 = originPx.x + span.b.x * pxPerUnit;
      const oy2 = originPx.y + span.b.z * pxPerUnit;
      const selectedOpen = opening.id === selectedOpeningId;

      const g = document.createElementNS(SVG_NS, 'g');
      g.dataset.openingId = opening.id;

      const gap = document.createElementNS(SVG_NS, 'line');
      gap.setAttribute('x1', String(ox1));
      gap.setAttribute('y1', String(oy1));
      gap.setAttribute('x2', String(ox2));
      gap.setAttribute('y2', String(oy2));
      gap.setAttribute('stroke', selectedOpen ? '#3b7ded' : '#f5f1ea');
      gap.setAttribute('stroke-width', String(Math.max(strokeWidth - 2, 2)));
      gap.setAttribute('stroke-linecap', 'butt');

      g.appendChild(gap);

      if (opening.type === 'door') {
        // Minimal door swing arc hint (quarter circle from hinge at span.a).
        const dx = ox2 - ox1;
        const dy = oy2 - oy1;
        const len = Math.hypot(dx, dy) || 1;
        const r = len;
        const nx = -dy / len;
        const ny = dx / len;
        const endX = ox1 + nx * r;
        const endY = oy1 + ny * r;
        const arc = document.createElementNS(SVG_NS, 'path');
        arc.setAttribute('d', `M ${ox2} ${oy2} A ${r} ${r} 0 0 0 ${endX} ${endY}`);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', selectedOpen ? '#3b7ded' : '#6b7280');
        arc.setAttribute('stroke-width', '1.5');
        arc.setAttribute('pointer-events', 'none');
        g.appendChild(arc);
      } else {
        // Window: double parallel tick across the gap.
        const mx = (ox1 + ox2) / 2;
        const my = (oy1 + oy2) / 2;
        const dx = ox2 - ox1;
        const dy = oy2 - oy1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * (strokeWidth * 0.45);
        const ny = (dx / len) * (strokeWidth * 0.45);
        const tick = document.createElementNS(SVG_NS, 'line');
        tick.setAttribute('x1', String(mx - nx));
        tick.setAttribute('y1', String(my - ny));
        tick.setAttribute('x2', String(mx + nx));
        tick.setAttribute('y2', String(my + ny));
        tick.setAttribute('stroke', selectedOpen ? '#3b7ded' : '#2563eb');
        tick.setAttribute('stroke-width', '2');
        tick.setAttribute('pointer-events', 'none');
        g.appendChild(tick);
      }

      this.openingsGroup.appendChild(g);
    }
  }
}
