import { canvasToPngBlob, type CanvasToBlob } from './PngCapture';

export type SvgRasterizer = (svg: string) => Promise<Blob>;

/**
 * Rasterize an SVG plan string to a PNG Blob via Image → canvas → toBlob.
 * Prefer this for annotated plan PNG export (Epic 22) over a live 3D screenshot.
 */
export async function rasterizeSvgToPng(
  svg: string,
  options: {
    toBlob?: CanvasToBlob;
    /** Injected for unit tests (jsdom cannot decode SVG images). */
    loadImage?: (
      svg: string,
    ) => Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D) => void }>;
  } = {},
): Promise<Blob> {
  const toBlob = options.toBlob ?? canvasToPngBlob;

  if (options.loadImage) {
    const image = await options.loadImage(svg);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width));
    canvas.height = Math.max(1, Math.round(image.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    image.draw(ctx);
    return toBlob(canvas);
  }

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadHtmlImage(url);
    const width = Math.max(1, img.naturalWidth || img.width || 1);
    const height = Math.max(1, img.naturalHeight || img.height || 1);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    return toBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode SVG for PNG export'));
    img.src = url;
  });
}
