import type { TextureDefinition } from './types';

/**
 * Deterministic pseudo-random generator (mulberry32) so the "stone" speckle
 * pattern is stable across renders/tests instead of relying on `Math.random`.
 */
function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawStripes(ctx: CanvasRenderingContext2D, def: TextureDefinition, size: number): void {
  const stripeCount = 6;
  const stripeHeight = size / stripeCount;
  ctx.fillStyle = def.accentColor;
  for (let i = 0; i < stripeCount; i += 1) {
    if (i % 2 !== 0) continue;
    ctx.fillRect(0, i * stripeHeight, size, stripeHeight);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, def: TextureDefinition, size: number): void {
  const cells = 4;
  const step = size / cells;
  ctx.strokeStyle = def.accentColor;
  ctx.lineWidth = Math.max(1, size / 32);
  ctx.beginPath();
  for (let i = 1; i < cells; i += 1) {
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
  }
  ctx.stroke();
}

function drawDots(ctx: CanvasRenderingContext2D, def: TextureDefinition, size: number): void {
  const random = createDeterministicRandom(size * 97 + 13);
  const dotCount = Math.max(10, Math.round(size / 4));
  ctx.fillStyle = def.accentColor;
  for (let i = 0; i < dotCount; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = size * (0.015 + random() * 0.025);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws a `size x size` tile of `def`'s pattern into `ctx`, starting from
 * `(0, 0)`. Shared by the ui-kit swatch preview, the 2D SVG surface fills
 * (rasterised into a `<pattern><image>`), and the 3D `CanvasTexture` used
 * by the three.js material factory — one implementation, three consumers.
 */
export function drawTexturePattern(
  ctx: CanvasRenderingContext2D,
  def: TextureDefinition,
  size: number,
): void {
  ctx.save();
  ctx.fillStyle = def.baseColor;
  ctx.fillRect(0, 0, size, size);

  switch (def.pattern) {
    case 'stripes':
      drawStripes(ctx, def, size);
      break;
    case 'grid':
      drawGrid(ctx, def, size);
      break;
    case 'dots':
      drawDots(ctx, def, size);
      break;
  }

  ctx.restore();
}

/** Creates an offscreen canvas with `def`'s pattern already drawn onto it. */
export function createTextureCanvas(def: TextureDefinition, size = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) drawTexturePattern(ctx, def, size);
  return canvas;
}
