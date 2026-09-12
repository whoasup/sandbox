import { getFurniturePreset } from '@sandbox/ui-kit';
import type { FurnitureObject } from '../../model/FurnitureObject';
import { patternIdFor } from './svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Labeled footprint rectangle for one furniture instance in the 2D plan.
 */
export class Svg2DFurnitureView {
  public readonly group: SVGGElement;
  private readonly base: SVGRectElement;
  private readonly overlay: SVGRectElement;
  private readonly label: SVGTextElement;

  public constructor(object: FurnitureObject) {
    this.group = document.createElementNS(SVG_NS, 'g');
    this.group.dataset.furnitureId = object.id;
    this.group.style.cursor = 'grab';

    this.base = document.createElementNS(SVG_NS, 'rect');
    this.overlay = document.createElementNS(SVG_NS, 'rect');
    this.overlay.setAttribute('pointer-events', 'none');
    this.overlay.setAttribute('opacity', '0.75');
    this.overlay.style.mixBlendMode = 'multiply';

    this.label = document.createElementNS(SVG_NS, 'text');
    this.label.setAttribute('text-anchor', 'middle');
    this.label.setAttribute('dominant-baseline', 'middle');
    this.label.setAttribute('font-size', '11');
    this.label.setAttribute('fill', '#1f2933');
    this.label.setAttribute('pointer-events', 'none');

    this.group.append(this.base, this.overlay, this.label);
  }

  public update(
    object: FurnitureObject,
    pxPerUnit: number,
    originPx: { x: number; y: number },
    selected: boolean,
  ): void {
    const widthPx = object.footprint.width * pxPerUnit;
    const depthPx = object.footprint.depth * pxPerUnit;
    const centerX = originPx.x + object.position.x * pxPerUnit;
    const centerY = originPx.y + object.position.z * pxPerUnit;
    const rotationDeg = -(object.rotationY * 180) / Math.PI;
    const preset = getFurniturePreset(object.catalogId);

    for (const el of [this.base, this.overlay]) {
      el.setAttribute('x', String(centerX - widthPx / 2));
      el.setAttribute('y', String(centerY - depthPx / 2));
      el.setAttribute('width', String(widthPx));
      el.setAttribute('height', String(depthPx));
      el.setAttribute('rx', String(Math.min(3, widthPx * 0.08)));
      el.setAttribute('transform', `rotate(${rotationDeg} ${centerX} ${centerY})`);
    }

    this.base.setAttribute('fill', object.color);
    this.overlay.setAttribute('fill', `url(#${patternIdFor(object.surface)})`);
    this.base.setAttribute('stroke', selected ? '#3b7ded' : '#00000033');
    this.base.setAttribute('stroke-width', selected ? '2.5' : '1');

    this.label.textContent = preset.label;
    this.label.setAttribute('x', String(centerX));
    this.label.setAttribute('y', String(centerY));
    this.label.setAttribute('transform', `rotate(${rotationDeg} ${centerX} ${centerY})`);
  }
}
