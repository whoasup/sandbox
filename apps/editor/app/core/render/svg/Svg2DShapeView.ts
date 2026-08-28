import type { SceneObject } from '../../model/SceneObject';
import { patternIdFor } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROUND_KINDS = new Set(['sphere', 'cylinder']);

/**
 * Owns the pair of SVG primitives (a solid-color base + a pattern overlay
 * blended on top) used to represent one `SceneObject` in the 2D top-down
 * view. Encapsulating per-shape DOM state here keeps `SvgRenderer` itself
 * a thin coordinator, mirroring how `THREE.Mesh` already encapsulates
 * per-object state on the 3D side.
 */
export class Svg2DShapeView {
  public readonly group: SVGGElement;
  private readonly base: SVGGraphicsElement;
  private readonly overlay: SVGGraphicsElement;
  private readonly isRound: boolean;

  public constructor(object: SceneObject) {
    this.isRound = ROUND_KINDS.has(object.kind);
    const tagName = this.isRound ? 'circle' : 'rect';

    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.shapeId = object.id;
    this.group.style.cursor = 'grab';

    this.base = document.createElementNS(SVG_NS, tagName);
    this.overlay = document.createElementNS(SVG_NS, tagName);
    this.overlay.setAttribute('pointer-events', 'none');
    this.overlay.setAttribute('opacity', '0.8');
    this.overlay.style.mixBlendMode = 'multiply';

    this.group.append(this.base, this.overlay);
  }

  public update(
    object: SceneObject,
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
  ): void {
    const widthPx = object.footprint.width * pxPerUnit;
    const depthPx = object.footprint.depth * pxPerUnit;
    const centerX = originPx.x + object.position.x * pxPerUnit;
    const centerY = originPx.y + object.position.z * pxPerUnit;
    const rotationDeg = -(object.rotationY * 180) / Math.PI;

    for (const el of [this.base, this.overlay]) {
      if (this.isRound) {
        el.setAttribute('cx', String(centerX));
        el.setAttribute('cy', String(centerY));
        el.setAttribute('r', String(widthPx / 2));
      } else {
        el.setAttribute('x', String(centerX - widthPx / 2));
        el.setAttribute('y', String(centerY - depthPx / 2));
        el.setAttribute('width', String(widthPx));
        el.setAttribute('height', String(depthPx));
        el.setAttribute('rx', String(Math.min(4, widthPx * 0.06)));
      }
      el.setAttribute('transform', `rotate(${rotationDeg} ${centerX} ${centerY})`);
    }

    this.base.setAttribute('fill', object.color);
    this.overlay.setAttribute('fill', `url(#${patternIdFor(object.surface)})`);
    this.base.setAttribute('stroke', selected ? '#3b7ded' : '#00000022');
    this.base.setAttribute('stroke-width', selected ? '2.5' : '1');
  }
}
