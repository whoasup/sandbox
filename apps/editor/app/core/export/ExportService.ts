import { SceneDocument } from '@sandbox/editor-core';
import type { SceneSnapshot } from '@sandbox/editor-core';
import { downloadBlob, exportFilename } from './downloadBlob';
import { SvgExportBuilder } from './SvgExportBuilder';

export interface ExportFloorContext {
  projectName: string;
  floorName: string;
  snapshot: SceneSnapshot;
}

export interface ExportFloorSource {
  getFloor(opts: { projectId: string; floorId: string }): Promise<ExportFloorContext | null>;
}

/**
 * Scene export facade: PNG / SVG / glTF for one active floor.
 * JSON project export stays on Epic 05 (`downloadProjectJson`).
 *
 * PNG / glTF paths dynamically import three.js so the editor shell does not
 * pay for WebGL on first paint (SVG export stays eager).
 */
export class ExportService {
  private livePngCapture: (() => Promise<Blob>) | null = null;

  public constructor(private readonly source: ExportFloorSource) {}

  /** Prefer the live 3D viewport when mounted; otherwise offscreen capture. */
  public setLivePngCapture(capture: (() => Promise<Blob>) | null): void {
    this.livePngCapture = capture;
  }

  public async exportPng(opts: { projectId: string; floorId: string }): Promise<Blob> {
    if (this.livePngCapture) {
      return this.livePngCapture();
    }
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const { PngCapture } = await import('./PngCapture');
    return PngCapture.fromDocument(document);
  }

  public async exportSvg(opts: { projectId: string; floorId: string }): Promise<Blob> {
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const svg = SvgExportBuilder.build(document);
    return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  public async exportGltf(opts: { projectId: string; floorId: string }): Promise<Blob> {
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const { GltfExportBuilder } = await import('./GltfExportBuilder');
    return GltfExportBuilder.exportBlob(document);
  }

  public async downloadPng(opts: { projectId: string; floorId: string }): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportPng(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'png'));
  }

  public async downloadSvg(opts: { projectId: string; floorId: string }): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportSvg(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'svg'));
  }

  public async downloadGltf(opts: { projectId: string; floorId: string }): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportGltf(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'glb'));
  }

  private async requireFloor(opts: {
    projectId: string;
    floorId: string;
  }): Promise<ExportFloorContext> {
    const ctx = await this.source.getFloor(opts);
    if (!ctx) {
      throw new Error('Этаж не найден для экспорта');
    }
    return ctx;
  }
}

function documentFromSnapshot(snapshot: SceneSnapshot): SceneDocument {
  const document = new SceneDocument();
  document.fromSnapshot(snapshot);
  return document;
}
