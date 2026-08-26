import { createTextureCanvas, TEXTURE_LIST } from '@sandbox/ui-kit';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PATTERN_TILE_PX = 48;

export function patternIdFor(surface: string): string {
  return `editor-surface-pattern-${surface}`;
}

/** Builds one `<pattern>` per surface, rasterised from the shared ui-kit texture drawer. */
export function createSurfacePatternDefs(): SVGDefsElement {
  const defs = document.createElementNS(SVG_NS, 'defs');

  for (const texture of TEXTURE_LIST) {
    const canvas = createTextureCanvas(texture, PATTERN_TILE_PX);
    const pattern = document.createElementNS(SVG_NS, 'pattern');
    pattern.setAttribute('id', patternIdFor(texture.id));
    pattern.setAttribute('width', String(PATTERN_TILE_PX));
    pattern.setAttribute('height', String(PATTERN_TILE_PX));
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('href', canvas.toDataURL('image/png'));
    image.setAttribute('width', String(PATTERN_TILE_PX));
    image.setAttribute('height', String(PATTERN_TILE_PX));
    pattern.appendChild(image);
    defs.appendChild(pattern);
  }

  return defs;
}
