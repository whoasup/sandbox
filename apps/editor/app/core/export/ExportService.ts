import { SceneDocument } from '@sandbox/editor-core';
import type { SceneSnapshot } from '@sandbox/editor-core';
import { downloadBlob, exportFilename, export360Filename } from './downloadBlob';
import type { PlanExportOptions } from './PlanExportOptions';
import { SvgExportBuilder } from './SvgExportBuilder';
import { rasterizeSvgToPng } from './rasterizeSvgToPng';

export type { PlanExportOptions, PlanStyle, SvgPlanBuildOptions } from './PlanExportOptions';

export interface ExportFloorContext {
  projectName: string;
  floorName: string;
  snapshot: SceneSnapshot;
}

export interface ExportFloorSource {
  getFloor(opts: { projectId: string; floorId: string }): Promise<ExportFloorContext | null>;
}

/**
 * Scene export facade: PNG / SVG / glTF / 360 for one active floor.
 * JSON project export stays on Epic 05 (`downloadProjectJson`).
 *
 * PNG is an annotated plan (SVG → canvas). glTF / 360 paths dynamically
 * import three.js so the editor shell does not pay for WebGL on first paint.
 */
export class ExportService {
  private live360Capture: (() => Promise<Blob>) | null = null;

  public constructor(private readonly source: ExportFloorSource) {}

  /** Prefer the live 3D viewport when mounted; otherwise offscreen cube capture. */
  public setLive360Capture(capture: (() => Promise<Blob>) | null): void {
    this.live360Capture = capture;
  }

  /** @deprecated Prefer setLive360Capture; PNG export uses annotated plan SVG. */
  public setLivePngCapture(_capture: (() => Promise<Blob>) | null): void {
    // Kept for call-site compatibility during Epic 22; PNG is plan-based.
  }

  public async exportPng(opts: PlanExportOptions): Promise<Blob> {
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const svg = SvgExportBuilder.build(document, {
      style: opts.style ?? 'clean',
      includeDimensions: opts.includeDimensions ?? true,
      includeLegend: opts.includeLegend ?? true,
      projectName: ctx.projectName,
      floorName: ctx.floorName,
    });
    return rasterizeSvgToPng(svg);
  }

  public async exportSvg(opts: PlanExportOptions): Promise<Blob> {
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const svg = SvgExportBuilder.build(document, {
      style: opts.style ?? 'clean',
      includeDimensions: opts.includeDimensions ?? true,
      includeLegend: opts.includeLegend ?? true,
      projectName: ctx.projectName,
      floorName: ctx.floorName,
    });
    return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  public async exportGltf(opts: { projectId: string; floorId: string }): Promise<Blob> {
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const { GltfExportBuilder } = await import('./GltfExportBuilder');
    return GltfExportBuilder.exportBlob(document);
  }

  public async export360(opts: { projectId: string; floorId: string }): Promise<Blob> {
    if (this.live360Capture) {
      return this.live360Capture();
    }
    const ctx = await this.requireFloor(opts);
    const document = documentFromSnapshot(ctx.snapshot);
    const { capture360FromDocument } = await import('./capture360');
    return capture360FromDocument(document);
  }

  public async downloadPng(opts: PlanExportOptions): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportPng(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'png'));
  }

  public async downloadSvg(opts: PlanExportOptions): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportSvg(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'svg'));
  }

  public async downloadGltf(opts: { projectId: string; floorId: string }): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.exportGltf(opts);
    downloadBlob(blob, exportFilename(ctx.projectName, ctx.floorName, 'glb'));
  }

  public async download360(opts: { projectId: string; floorId: string }): Promise<void> {
    const ctx = await this.requireFloor(opts);
    const blob = await this.export360(opts);
    downloadBlob(blob, export360Filename(ctx.projectName, ctx.floorName));
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
