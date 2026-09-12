import { SceneDocument } from '@sandbox/editor-core';
import type { SceneSnapshot } from '@sandbox/editor-core';
import * as THREE from 'three';

import { GltfExportBuilder } from './GltfExportBuilder';

export type CanvasToBlob = (canvas: HTMLCanvasElement) => Promise<Blob>;

/** Default: read pixels from a canvas via `toBlob`. */
export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('canvas.toBlob is not available'));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG capture failed'));
    }, 'image/png');
  });
}

/**
 * PNG capture helpers: live WebGL canvas, or a one-shot offscreen render
 * of the floor document (used when the 3D viewport is not mounted).
 */
export class PngCapture {
  /**
   * Capture from an existing WebGL canvas. Caller should render a fresh
   * frame first when `preserveDrawingBuffer` is enabled.
   */
  public static fromCanvas(
    canvas: HTMLCanvasElement,
    toBlob: CanvasToBlob = canvasToPngBlob,
  ): Promise<Blob> {
    return toBlob(canvas);
  }

  /**
   * Offscreen capture: build the same mesh scene as glTF export, render once
   * with a temporary WebGLRenderer, then return a PNG Blob.
   */
  public static async fromDocument(
    document: SceneDocument,
    options: {
      width?: number;
      height?: number;
      toBlob?: CanvasToBlob;
      /** Injected for unit tests that cannot create a WebGL context. */
      renderToCanvas?: (scene: THREE.Scene, width: number, height: number) => HTMLCanvasElement;
    } = {},
  ): Promise<Blob> {
    const width = options.width ?? 1024;
    const height = options.height ?? 768;
    const toBlob = options.toBlob ?? canvasToPngBlob;
    const scene = GltfExportBuilder.buildScene(document);

    try {
      const canvas = options.renderToCanvas
        ? options.renderToCanvas(scene, width, height)
        : renderOffscreen(scene, width, height);
      return await toBlob(canvas);
    } finally {
      disposeScene(scene);
    }
  }

  public static async fromSnapshot(
    snapshot: SceneSnapshot,
    options?: Parameters<typeof PngCapture.fromDocument>[1],
  ): Promise<Blob> {
    const document = new SceneDocument();
    document.fromSnapshot(snapshot);
    return PngCapture.fromDocument(document, options);
  }
}

function renderOffscreen(scene: THREE.Scene, width: number, height: number): HTMLCanvasElement {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height, false);
  renderer.setClearColor(0xf5f1ea, 1);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
  camera.position.set(6, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  const canvas = renderer.domElement;
  renderer.dispose();
  return canvas;
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry?.dispose();
    const material = object.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}
