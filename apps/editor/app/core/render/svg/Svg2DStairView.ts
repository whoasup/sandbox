import type { StairObject } from '@sandbox/editor-core';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Plan symbol: hatched footprint + direction arrow. */
export class Svg2DStairView {
  public readonly group: SVGGElement;
  private readonly base: SVGRectElement;
  private readonly hatch: SVGPathElement;
  private readonly arrow: SVGPathElement;
  private readonly label: SVGTextElement;

  public constructor(stair: StairObject) {
    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.stairId = stair.id;
    this.group.style.cursor = 'pointer';

    this.base = document.createElementNS(SVG_NS, 'rect');
    this.hatch = document.createElementNS(SVG_NS, 'path');
    this.hatch.setAttribute('fill', 'none');
    this.hatch.setAttribute('stroke', '#5b6570');
    this.hatch.setAttribute('stroke-width', '1');
    this.hatch.setAttribute('pointer-events', 'none');

    this.arrow = document.createElementNS(SVG_NS, 'path');
    this.arrow.setAttribute('fill', 'none');
    this.arrow.setAttribute('stroke', '#1f2933');
    this.arrow.setAttribute('stroke-width', '2');
    this.arrow.setAttribute('stroke-linecap', 'round');
    this.arrow.setAttribute('stroke-linejoin', 'round');
    this.arrow.setAttribute('pointer-events', 'none');

    this.label = document.createElementNS(SVG_NS, 'text');
    this.label.setAttribute('text-anchor', 'middle');
    this.label.setAttribute('dominant-baseline', 'middle');
    this.label.setAttribute('font-size', '10');
    this.label.setAttribute('fill', '#1f2933');
    this.label.setAttribute('pointer-events', 'none');

    this.group.append(this.base, this.hatch, this.arrow, this.label);
  }

  public update(
    stair: StairObject,
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
  ): void {
    const widthPx = stair.width * pxPerUnit;
    const depthPx = stair.depth * pxPerUnit;
    const cx = originPx.x + stair.position.x * pxPerUnit;
    const cy = originPx.y + stair.position.z * pxPerUnit;
    const rot = -(stair.rotationY * 180) / Math.PI;

    this.base.setAttribute('x', String(cx - widthPx / 2));
    this.base.setAttribute('y', String(cy - depthPx / 2));
    this.base.setAttribute('width', String(widthPx));
    this.base.setAttribute('height', String(depthPx));
    this.base.setAttribute('rx', '2');
    this.base.setAttribute('fill', selected ? '#dbeafe' : '#e8edf2');
    this.base.setAttribute('stroke', selected ? '#3b7ded' : '#5b6570');
    this.base.setAttribute('stroke-width', selected ? '2.5' : '1.5');
    this.base.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);

    const steps = Math.min(stair.stepCount, 16);
    const lines: string[] = [];
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const y = cy - depthPx / 2 + t * depthPx;
      lines.push(`M ${cx - widthPx / 2} ${y} L ${cx + widthPx / 2} ${y}`);
    }
    this.hatch.setAttribute('d', lines.join(' '));
    this.hatch.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);

    const dir = stair.direction === 'up' ? -1 : 1;
    const ay0 = cy + dir * (depthPx * 0.28);
    const ay1 = cy - dir * (depthPx * 0.28);
    this.arrow.setAttribute(
      'd',
      `M ${cx} ${ay0} L ${cx} ${ay1} M ${cx - 6} ${ay1 + dir * 8} L ${cx} ${ay1} L ${cx + 6} ${ay1 + dir * 8}`,
    );
    this.arrow.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);

    this.label.textContent = stair.direction === 'up' ? '↑' : '↓';
    this.label.setAttribute('x', String(cx));
    this.label.setAttribute('y', String(cy));
    this.label.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
  }
}
