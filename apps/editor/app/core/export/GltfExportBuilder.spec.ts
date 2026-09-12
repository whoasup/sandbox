import { describe, expect, it } from 'vitest';
import { SceneDocument } from '@sandbox/editor-core';
import { GltfExportBuilder } from './GltfExportBuilder';

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob);
  });
}

describe('GltfExportBuilder', () => {
  it('exports a non-empty glb blob with glTF magic header for wall + chair', async () => {
    const doc = new SceneDocument();
    doc.addWall({
      id: 'wall_1',
      start: { x: 0, z: 0 },
      end: { x: 3, z: 0 },
    });
    doc.addFurniture('chair', { id: 'chair_1', position: { x: 1, z: 1 } });

    const blob = await GltfExportBuilder.exportBlob(doc);

    expect(blob.size).toBeGreaterThan(100);
    expect(blob.type).toBe('model/gltf-binary');

    const bytes = await readBlobBytes(blob);
    const magic = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
    expect(magic).toBe('glTF');
  });

  it('includes stairs meshes in the export scene', () => {
    const doc = new SceneDocument();
    doc.addStair({
      id: 'stair_1',
      floorId: 'a',
      targetFloorId: 'b',
      position: { x: 0, z: 0 },
    });
    const scene = GltfExportBuilder.buildScene(doc);
    const names: string[] = [];
    scene.traverse((obj) => {
      if (obj.name) names.push(obj.name);
    });
    expect(names).toContain('stair_1');
  });
});
