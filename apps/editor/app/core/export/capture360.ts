import * as THREE from 'three';
import type { SceneDocument } from '@sandbox/editor-core';
import { canvasToPngBlob, type CanvasToBlob } from './PngCapture';
import { GltfExportBuilder } from './GltfExportBuilder';

const EYE_HEIGHT = 1.6;

type CubeFace = {
  dir: THREE.Vector3;
  up: THREE.Vector3;
};

/** Standard cube faces: +X -X +Y -Y +Z -Z */
const CUBE_FACES: CubeFace[] = [
  { dir: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, -1, 0) },
  { dir: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, -1, 0) },
  { dir: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, 1) },
  { dir: new THREE.Vector3(0, -1, 0), up: new THREE.Vector3(0, 0, -1) },
  { dir: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, -1, 0) },
  { dir: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, -1, 0) },
];

/**
 * Offscreen 360 fallback: render six cube faces from eye height at the
 * orbit origin and stitch them into a simple equirectangular PNG.
 */
export async function capture360FromDocument(
  document: SceneDocument,
  options: {
    faceSize?: number;
    equirectWidth?: number;
    equirectHeight?: number;
    eye?: THREE.Vector3;
    toBlob?: CanvasToBlob;
    /** Injected for unit tests that cannot create a WebGL context. */
    renderFaces?: (eye: THREE.Vector3, faceSize: number) => HTMLCanvasElement[];
  } = {},
): Promise<Blob> {
  const faceSize = options.faceSize ?? 256;
  const equirectWidth = options.equirectWidth ?? faceSize * 4;
  const equirectHeight = options.equirectHeight ?? faceSize * 2;
  const toBlob = options.toBlob ?? canvasToPngBlob;
  const eye = options.eye ?? new THREE.Vector3(0, EYE_HEIGHT, 0);

  const scene = GltfExportBuilder.buildScene(document);
  try {
    const faces = options.renderFaces
      ? options.renderFaces(eye, faceSize)
      : renderCubeFaces(scene, eye, faceSize);
    const canvas = stitchEquirect(faces, equirectWidth, equirectHeight);
    return await toBlob(canvas);
  } finally {
    disposeScene(scene);
  }
}

export function stitchEquirect(
  faces: HTMLCanvasElement[],
  width: number,
  height: number,
): HTMLCanvasElement {
  if (faces.length !== 6) {
    throw new Error('Expected 6 cube faces for 360 stitch');
  }

  const faceSize = faces[0]!.width;
  const faceData = faces.map((face) => {
    const ctx = face.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    return ctx.getImageData(0, 0, face.width, face.height);
  });

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const outCtx = out.getContext('2d');
  if (!outCtx) throw new Error('2D canvas context unavailable');
  const image = outCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const theta = v * Math.PI;
    const sinTheta = Math.sin(theta);
    const dy = Math.cos(theta);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const phi = u * Math.PI * 2 - Math.PI;
      const dx = sinTheta * Math.sin(phi);
      const dz = sinTheta * Math.cos(phi);
      const sample = sampleCubemap(faceData, faceSize, dx, dy, dz);
      const i = (y * width + x) * 4;
      image.data[i] = sample[0];
      image.data[i + 1] = sample[1];
      image.data[i + 2] = sample[2];
      image.data[i + 3] = 255;
    }
  }

  outCtx.putImageData(image, 0, 0);
  return out;
}

function sampleCubemap(
  faces: ImageData[],
  faceSize: number,
  dx: number,
  dy: number,
  dz: number,
): [number, number, number] {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const az = Math.abs(dz);

  let faceIndex: number;
  let sc: number;
  let tc: number;
  let ma: number;

  if (ax >= ay && ax >= az) {
    ma = ax;
    if (dx > 0) {
      faceIndex = 0;
      sc = -dz;
      tc = -dy;
    } else {
      faceIndex = 1;
      sc = dz;
      tc = -dy;
    }
  } else if (ay >= ax && ay >= az) {
    ma = ay;
    if (dy > 0) {
      faceIndex = 2;
      sc = dx;
      tc = dz;
    } else {
      faceIndex = 3;
      sc = dx;
      tc = -dz;
    }
  } else {
    ma = az;
    if (dz > 0) {
      faceIndex = 4;
      sc = dx;
      tc = -dy;
    } else {
      faceIndex = 5;
      sc = -dx;
      tc = -dy;
    }
  }

  const u = 0.5 * (sc / ma + 1);
  const v = 0.5 * (tc / ma + 1);
  const px = Math.min(faceSize - 1, Math.max(0, Math.floor(u * faceSize)));
  const py = Math.min(faceSize - 1, Math.max(0, Math.floor(v * faceSize)));
  const data = faces[faceIndex]!.data;
  const i = (py * faceSize + px) * 4;
  return [data[i]!, data[i + 1]!, data[i + 2]!];
}

function renderCubeFaces(
  scene: THREE.Scene,
  eye: THREE.Vector3,
  faceSize: number,
): HTMLCanvasElement[] {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(faceSize, faceSize, false);
  renderer.setClearColor(0xf5f1ea, 1);

  const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 200);
  const faces: HTMLCanvasElement[] = [];

  try {
    for (const face of CUBE_FACES) {
      camera.position.copy(eye);
      camera.up.copy(face.up);
      camera.lookAt(eye.clone().add(face.dir));
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const canvas = document.createElement('canvas');
      canvas.width = faceSize;
      canvas.height = faceSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D canvas context unavailable');
      ctx.drawImage(renderer.domElement, 0, 0);
      faces.push(canvas);
    }
  } finally {
    renderer.dispose();
  }

  return faces;
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

export { CUBE_FACES, EYE_HEIGHT };
