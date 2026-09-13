import type { DimensionLine } from '@sandbox/editor-core';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** User-drawn dimension annotation: ticks, offset line, and length label. */
export class Svg2DDimensionView {
  public readonly group: SVGGElement;
  private readonly line: SVGLineElement;
  private readonly tickStart: SVGLineElement;
  private readonly tickEnd: SVGLineElement;
  private readonly label: SVGTextElement;
  private readonly hit: SVGLineElement;

  public constructor(dim: DimensionLine) {
    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.dimensionId = dim.id;
    this.group.style.cursor = 'pointer';

    this.hit = document.createElementNS(SVG_NS, 'line');
    this.hit.setAttribute('stroke', 'transparent');
    this.hit.setAttribute('stroke-width', '14');
    this.hit.setAttribute('stroke-linecap', 'round');

    this.line = document.createElementNS(SVG_NS, 'line');
    this.line.setAttribute('stroke-linecap', 'butt');
    this.line.setAttribute('pointer-events', 'none');

    this.tickStart = document.createElementNS(SVG_NS, 'line');
    this.tickStart.setAttribute('pointer-events', 'none');
    this.tickEnd = document.createElementNS(SVG_NS, 'line');
    this.tickEnd.setAttribute('pointer-events', 'none');

    this.label = document.createElementNS(SVG_NS, 'text');
    this.label.setAttribute('text-anchor', 'middle');
    this.label.setAttribute('dominant-baseline', 'middle');
    this.label.setAttribute('font-size', '11');
    this.label.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
    this.label.setAttribute('pointer-events', 'none');

    this.group.append(this.hit, this.line, this.tickStart, this.tickEnd, this.label);
  }

  public update(
    dim: DimensionLine,
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
  ): void {
    this.group.dataset.dimensionId = dim.id;

    const dx = dim.end.x - dim.start.x;
    const dz = dim.end.z - dim.start.z;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;
    const off = dim.offset;

    const a = {
      x: dim.start.x + nx * off,
      z: dim.start.z + nz * off,
    };
    const b = {
      x: dim.end.x + nx * off,
      z: dim.end.z + nz * off,
    };

    const ax = originPx.x + a.x * pxPerUnit;
    const ay = originPx.y + a.z * pxPerUnit;
    const bx = originPx.x + b.x * pxPerUnit;
    const by = originPx.y + b.z * pxPerUnit;

    const stroke = selected ? '#3b7ded' : '#374151';
    for (const el of [this.line, this.tickStart, this.tickEnd]) {
      el.setAttribute('stroke', stroke);
      el.setAttribute('stroke-width', selected ? '2' : '1.25');
    }

    this.hit.setAttribute('x1', String(ax));
    this.hit.setAttribute('y1', String(ay));
    this.hit.setAttribute('x2', String(bx));
    this.hit.setAttribute('y2', String(by));

    this.line.setAttribute('x1', String(ax));
    this.line.setAttribute('y1', String(ay));
    this.line.setAttribute('x2', String(bx));
    this.line.setAttribute('y2', String(by));

    const tick = 6;
    const sx0 = originPx.x + dim.start.x * pxPerUnit;
    const sy0 = originPx.y + dim.start.z * pxPerUnit;
    const sx1 = originPx.x + dim.end.x * pxPerUnit;
    const sy1 = originPx.y + dim.end.z * pxPerUnit;

    this.tickStart.setAttribute('x1', String(sx0));
    this.tickStart.setAttribute('y1', String(sy0));
    this.tickStart.setAttribute('x2', String(ax + nx * tick));
    this.tickStart.setAttribute('y2', String(ay + nz * tick));

    this.tickEnd.setAttribute('x1', String(sx1));
    this.tickEnd.setAttribute('y1', String(sy1));
    this.tickEnd.setAttribute('x2', String(bx + nx * tick));
    this.tickEnd.setAttribute('y2', String(by + nz * tick));

    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const angleDeg = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    const readable = angleDeg > 90 || angleDeg < -90 ? angleDeg + 180 : angleDeg;

    this.label.setAttribute('x', String(mx));
    this.label.setAttribute('y', String(my - 8));
    this.label.setAttribute('fill', stroke);
    this.label.setAttribute('transform', `rotate(${readable} ${mx} ${my - 8})`);
    this.label.textContent = `${dim.length.toFixed(2)} м`;
  }
}
