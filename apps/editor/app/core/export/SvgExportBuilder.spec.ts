import { describe, expect, it } from 'vitest';
import { SceneDocument } from '../model/SceneDocument';
import { SvgExportBuilder } from './SvgExportBuilder';

function closedSquare(doc: SceneDocument): void {
  doc.addWall({ id: 'w0', start: { x: 0, z: 0 }, end: { x: 4, z: 0 } });
  doc.addWall({ id: 'w1', start: { x: 4, z: 0 }, end: { x: 4, z: 4 } });
  doc.addWall({ id: 'w2', start: { x: 4, z: 4 }, end: { x: 0, z: 4 } });
  doc.addWall({ id: 'w3', start: { x: 0, z: 4 }, end: { x: 0, z: 0 } });
}

describe('SvgExportBuilder', () => {
  it('exports a closed square room with wall and room layers', () => {
    const doc = new SceneDocument();
    closedSquare(doc);

    const svg = SvgExportBuilder.build(doc, { includeGrid: false });

    expect(svg).toContain('<svg');
    expect(svg).toContain('data-export="floor-plan"');
    expect(svg).toContain('data-layer="walls"');
    expect(svg).toContain('data-layer="rooms"');
    expect(svg).toContain('data-wall-id="w0"');
    expect((svg.match(/data-wall-id=/g) ?? []).length).toBe(4);
    expect(svg).toContain('<line');
    expect(svg).toContain('<polygon');
  });

  it('includes furniture footprints and stair symbols', () => {
    const doc = new SceneDocument();
    closedSquare(doc);
    doc.addFurniture('chair', { id: 'chair_1', position: { x: 1, z: 1 } });
    doc.addStair({
      id: 'stair_1',
      floorId: 'floor_a',
      targetFloorId: 'floor_b',
      position: { x: 2, z: 2 },
    });

    const svg = SvgExportBuilder.build(doc, { includeGrid: false });

    expect(svg).toContain('data-layer="furniture"');
    expect(svg).toContain('data-furniture-id="chair_1"');
    expect(svg).toContain('data-layer="stairs"');
    expect(svg).toContain('data-stair-id="stair_1"');
  });

  it('includes shape footprints', () => {
    const doc = new SceneDocument();
    doc.addShape('cube', { id: 'cube_1', position: { x: 0, z: 0 } });
    const svg = SvgExportBuilder.build(doc, { includeGrid: false });
    expect(svg).toContain('data-layer="shapes"');
    expect(svg).toContain('data-shape-id="cube_1"');
  });
});
