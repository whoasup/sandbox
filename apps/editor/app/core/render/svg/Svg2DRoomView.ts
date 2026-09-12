import type { Room, Point2 } from '@sandbox/editor-core';
import { patternIdFor } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Top-down polygon fill for a detected room. */
export class Svg2DRoomView {
  public readonly group: SVGGElement;
  private readonly fill: SVGPolygonElement;
  private readonly stroke: SVGPolygonElement;

  public constructor(room: Room) {
    this.group = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    this.group.dataset.roomId = room.id;
    this.group.style.cursor = 'pointer';

    this.fill = document.createElementNS(SVG_NS, 'polygon') as SVGPolygonElement;
    this.fill.setAttribute('stroke', 'none');
    this.fill.setAttribute('opacity', '0.72');

    this.stroke = document.createElementNS(SVG_NS, 'polygon') as SVGPolygonElement;
    this.stroke.setAttribute('fill', 'none');
    this.stroke.setAttribute('stroke-width', '1.5');
    this.stroke.setAttribute('pointer-events', 'none');

    this.group.append(this.fill, this.stroke);
  }

  public update(
    room: Room,
    pxPerUnit: number,
    origin: { x: number; y: number },
    selected: boolean,
  ): void {
    this.group.dataset.roomId = room.id;
    const points = room.polygon
      .map((p: Point2) => {
        const x = origin.x + p.x * pxPerUnit;
        const y = origin.y + p.z * pxPerUnit;
        return `${x},${y}`;
      })
      .join(' ');
    this.fill.setAttribute('points', points);
    this.stroke.setAttribute('points', points);

    if (room.floorSurface) {
      this.fill.setAttribute('fill', `url(#${patternIdFor(room.floorSurface)})`);
    } else {
      this.fill.setAttribute('fill', room.floorColor);
    }
    this.stroke.setAttribute('stroke', selected ? '#3b7ded' : 'rgba(0,0,0,0.18)');
    this.stroke.setAttribute('stroke-width', selected ? '2.5' : '1.5');
  }
}
