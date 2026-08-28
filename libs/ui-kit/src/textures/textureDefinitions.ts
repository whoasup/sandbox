import type { SurfaceKind, TextureDefinition } from './types';

/**
 * The three surface finishes offered across the editor's shapes. This is
 * the single source of truth for surface metadata: both the `UiTextureSwatch`
 * component (SVG/canvas preview) and the editor app's three.js material
 * factory read from it, so the 2D and 3D renderers always agree on how a
 * given surface looks.
 */
export const TEXTURE_DEFINITIONS: Record<SurfaceKind, TextureDefinition> = {
  wood: {
    id: 'wood',
    label: 'Дерево',
    pattern: 'stripes',
    baseColor: '#c8905c',
    accentColor: '#9c6b3d',
  },
  fabric: {
    id: 'fabric',
    label: 'Ткань',
    pattern: 'grid',
    baseColor: '#7c9cc9',
    accentColor: '#5b7ba8',
  },
  stone: {
    id: 'stone',
    label: 'Камень',
    pattern: 'dots',
    baseColor: '#b9b9b3',
    accentColor: '#8f8f89',
  },
};

export const TEXTURE_LIST: TextureDefinition[] = Object.values(TEXTURE_DEFINITIONS);

export function getTextureDefinition(kind: SurfaceKind): TextureDefinition {
  return TEXTURE_DEFINITIONS[kind];
}
