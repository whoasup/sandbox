/**
 * Shared Vitest setup: silence jsdom's "Not implemented: HTMLCanvasElement"
 * warnings from texture / export tests without pulling in the native `canvas`
 * package.
 */
import { vi } from 'vitest';

function createMockContext2d(): CanvasRenderingContext2D {
  const ctx = {
    canvas: document.createElement('canvas'),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    drawImage: vi.fn(),
    createImageData: vi.fn((width: number, height?: number) => ({
      data: new Uint8ClampedArray(width * (height ?? width) * 4),
      width,
      height: height ?? width,
      colorSpace: 'srgb' as const,
    })),
    getImageData: vi.fn((sx: number, sy: number, sw: number, sh: number) => ({
      data: new Uint8ClampedArray(sw * sh * 4),
      width: sw,
      height: sh,
      colorSpace: 'srgb' as const,
      sx,
      sy,
    })),
    putImageData: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    transform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(() => null),
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  contextId: string,
): RenderingContext | null {
  if (contextId === '2d') {
    const ctx = createMockContext2d();
    Object.defineProperty(ctx, 'canvas', { value: this });
    return ctx;
  }
  return null;
} as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = function toDataURL(): string {
  return 'data:image/png;base64,';
};
