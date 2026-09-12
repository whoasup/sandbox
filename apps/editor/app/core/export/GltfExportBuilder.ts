import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { SceneDocument } from '../model/SceneDocument';
import type { SceneSnapshot } from '../model/types';
import { ThreeFurnitureMesh } from '../render/three/ThreeFurnitureMesh';
import { ThreeMeshFactory } from '../render/three/ThreeMeshFactory';
import { ThreeRoomFloorMesh } from '../render/three/ThreeRoomFloorMesh';
import { ThreeStairMesh } from '../render/three/ThreeStairMesh';
import { ThreeWallMesh } from '../render/three/ThreeWallMesh';

/**
 * Builds a three.js scene for the active floor using the same mesh factories
 * as the editor, then serializes it with `GLTFExporter` (binary `.glb`).
 */
export class GltfExportBuilder {
  /** Assemble an export scene (caller must dispose meshes when done). */
  public static buildScene(document: SceneDocument): THREE.Scene {
    const scene = new THREE.Scene();
    scene.name = 'export-floor';

    const openings = document.listOpenings();
    for (const room of document.listRooms()) {
      const view = new ThreeRoomFloorMesh(room);
      scene.add(view.mesh);
    }
    for (const wall of document.listWalls()) {
      const view = new ThreeWallMesh(wall);
      view.update(
        wall,
        openings.filter((o) => o.wallId === wall.id),
      );
      scene.add(view.mesh);
    }
    for (const shape of document.list()) {
      scene.add(ThreeMeshFactory.createMesh(shape));
    }
    for (const item of document.listFurniture()) {
      const view = new ThreeFurnitureMesh(item);
      scene.add(view.mesh);
    }
    for (const stair of document.listStairs()) {
      const view = new ThreeStairMesh(stair);
      scene.add(view.mesh);
    }

    return scene;
  }

  public static buildSceneFromSnapshot(snapshot: SceneSnapshot): THREE.Scene {
    const document = new SceneDocument();
    document.fromSnapshot(snapshot);
    return GltfExportBuilder.buildScene(document);
  }

  public static async exportBlob(document: SceneDocument): Promise<Blob> {
    const scene = GltfExportBuilder.buildScene(document);
    try {
      // CanvasTexture maps need a real 2D context; strip them so export works
      // headlessly (colors remain). Live editor materials are unaffected.
      stripTextureMaps(scene);
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true });
      if (!(result instanceof ArrayBuffer)) {
        throw new Error('Expected binary glTF ArrayBuffer');
      }
      return new Blob([result], { type: 'model/gltf-binary' });
    } finally {
      disposeScene(scene);
    }
  }
}

function stripTextureMaps(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || !('map' in material)) continue;
      const std = material as THREE.MeshStandardMaterial;
      std.map = null;
      std.needsUpdate = true;
    }
  });
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
