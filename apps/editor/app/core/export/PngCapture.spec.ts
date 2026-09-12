import { describe, expect, it, vi } from 'vitest';
import { SceneDocument } from '@sandbox/editor-core';
import { PngCapture } from './PngCapture';
import { ExportService } from './ExportService';

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

    const blob = await service.exportSvg({ projectId: 'p1', floorId: 'f1' });
    expect(blob.size).toBeGreaterThan(50);
    expect(blob.type).toContain('svg');
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsText(blob);
    });
    expect(text).toContain('data-wall-id="w0"');
  });

  it('exportPng prefers the live capture when registered', async () => {
    const live = new Blob(['live'], { type: 'image/png' });
    const service = new ExportService({
      getFloor: async () => ({
        projectName: 'P',
        floorName: 'F',
        snapshot: new SceneDocument().toSnapshot(),
      }),
    });
    service.setLivePngCapture(async () => live);

    const blob = await service.exportPng({ projectId: 'p', floorId: 'f' });
    expect(blob).toBe(live);
  });
});
