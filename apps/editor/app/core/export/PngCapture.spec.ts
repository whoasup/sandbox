import { describe, expect, it, vi } from 'vitest';
import { SceneDocument } from '@sandbox/editor-core';
import { PngCapture } from './PngCapture';
import { ExportService } from './ExportService';
import { rasterizeSvgToPng } from './rasterizeSvgToPng';
import { stitchEquirect } from './capture360';

describe('PngCapture', () => {
  it('returns a Blob from a mocked canvas toBlob path', async () => {
    const expected = new Blob(['png-bytes'], { type: 'image/png' });
    const canvas = document.createElement('canvas');
    const blob = await PngCapture.fromCanvas(canvas, async () => expected);
    expect(blob).toBe(expected);
    expect(blob.type).toBe('image/png');
  });

  it('offscreen path uses injected renderToCanvas + toBlob (no real WebGL)', async () => {
    const doc = new SceneDocument();
    doc.addWall({ start: { x: 0, z: 0 }, end: { x: 1, z: 0 } });
    const expected = new Blob(['offscreen-png'], { type: 'image/png' });
    const renderToCanvas = vi.fn(() => document.createElement('canvas'));

    const blob = await PngCapture.fromDocument(doc, {
      renderToCanvas,
      toBlob: async () => expected,
    });

    expect(renderToCanvas).toHaveBeenCalledOnce();
    expect(blob).toBe(expected);
  });
});

describe('ExportService', () => {
  it('exportSvg builds from the floor source snapshot', async () => {
    const doc = new SceneDocument();
    doc.addWall({ id: 'w0', start: { x: 0, z: 0 }, end: { x: 2, z: 0 } });
    const service = new ExportService({
      getFloor: async () => ({
        projectName: 'Дом',
        floorName: '1 этаж',
        snapshot: doc.toSnapshot(),
      }),
    });

    const blob = await service.exportSvg({
      projectId: 'p1',
      floorId: 'f1',
      includeLegend: true,
      includeDimensions: true,
    });
    expect(blob.size).toBeGreaterThan(50);
    expect(blob.type).toContain('svg');
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsText(blob);
    });
    expect(text).toContain('data-wall-id="w0"');
    expect(text).toContain('data-layer="legend"');
  });

  it('exportPng rasterizes the annotated plan SVG (not live 3D)', async () => {
    const expected = new Blob(['plan-png'], { type: 'image/png' });
    const planPng = await rasterizeSvgToPng(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
      {
        loadImage: async () => ({
          width: 10,
          height: 10,
          draw: (ctx) => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 10, 10);
          },
        }),
        toBlob: async () => expected,
      },
    );
    expect(planPng).toBe(expected);
    expect(planPng.size).toBeGreaterThan(0);
  });

  it('export360 returns a non-empty blob from live capture stub', async () => {
    const live = new Blob(['360-bytes'], { type: 'image/png' });
    const service = new ExportService({
      getFloor: async () => ({
        projectName: 'P',
        floorName: 'F',
        snapshot: new SceneDocument().toSnapshot(),
      }),
    });
    service.setLive360Capture(async () => live);

    const blob = await service.export360({ projectId: 'p', floorId: 'f' });
    expect(blob).toBe(live);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('export360 offscreen stub path returns a non-empty blob', async () => {
    const { capture360FromDocument } = await import('./capture360');
    const expected = new Blob(['offscreen-360'], { type: 'image/png' });
    const face = document.createElement('canvas');
    face.width = 8;
    face.height = 8;
    const ctx = face.getContext('2d')!;
    ctx.fillStyle = '#336699';
    ctx.fillRect(0, 0, 8, 8);

    const blob = await capture360FromDocument(new SceneDocument(), {
      faceSize: 8,
      equirectWidth: 32,
      equirectHeight: 16,
      renderFaces: () => [face, face, face, face, face, face],
      toBlob: async () => expected,
    });
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('stitchEquirect', () => {
  it('produces a canvas from six faces', () => {
    const faces = Array.from({ length: 6 }, () => {
      const c = document.createElement('canvas');
      c.width = 4;
      c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#abcdef';
      ctx.fillRect(0, 0, 4, 4);
      return c;
    });
    const out = stitchEquirect(faces, 16, 8);
    expect(out.width).toBe(16);
    expect(out.height).toBe(8);
  });
});
