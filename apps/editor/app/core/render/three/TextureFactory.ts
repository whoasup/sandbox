import { createTextureCanvas, getTextureDefinition, type SurfaceKind } from '@sandbox/ui-kit';
import * as THREE from 'three';

/**
 * Caches one `THREE.CanvasTexture` per surface kind, rasterised from the
 * exact same `drawTexturePattern` routine ui-kit's `UiTextureSwatch` uses —
 * so the material preview in the toolbar always matches the 3D surface.
 */
export class TextureFactory {
  private static readonly cache = new Map<SurfaceKind, THREE.Texture>();

  public static get(surface: SurfaceKind): THREE.Texture {
    const cached = TextureFactory.cache.get(surface);
    if (cached) return cached;

    const canvas = createTextureCanvas(getTextureDefinition(surface), 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    TextureFactory.cache.set(surface, texture);
    return texture;
  }
}
