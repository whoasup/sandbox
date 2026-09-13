import * as THREE from 'three';
import { getFurniturePreset, type FurnitureCatalogId } from '@sandbox/ui-kit';
import type { FurnitureObject } from '@sandbox/editor-core';
import { TextureFactory } from './TextureFactory';

/**
 * Simple composed-box meshes per furniture preset (no external glTF).
 * Meshes are built at preset size; `update` applies non-uniform scale
 * from object.width/depth/height vs preset dims.
 */
export class ThreeFurnitureMesh {
  public readonly mesh: THREE.Group;

  public constructor(object: FurnitureObject) {
    this.mesh = new THREE.Group();
    this.mesh.name = object.id;
    this.mesh.userData.entityType = 'furniture';
    this.mesh.userData.catalogId = object.catalogId;
    this.buildParts(object.catalogId);
    this.update(object);
  }

  public update(object: FurnitureObject): void {
    if (this.mesh.userData.catalogId !== object.catalogId) {
      this.clearParts();
      this.buildParts(object.catalogId);
      this.mesh.userData.catalogId = object.catalogId;
    }
    const preset = getFurniturePreset(object.catalogId);
    this.mesh.position.set(object.position.x, 0, object.position.z);
    this.mesh.rotation.y = object.rotationY;
    this.mesh.scale.set(
      object.width / preset.footprint.width,
      object.height / preset.height,
      object.depth / preset.footprint.depth,
    );
    this.applyMaterial(object);
  }

  public dispose(): void {
    this.clearParts();
  }

  private clearParts(): void {
    for (const child of [...this.mesh.children]) {
      this.mesh.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }
  }

  private buildParts(catalogId: FurnitureCatalogId): void {
    const preset = getFurniturePreset(catalogId);
    const { width, depth } = preset.footprint;
    const height = preset.height;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(preset.defaultColor),
      map: TextureFactory.get(preset.defaultSurface),
      roughness: 0.85,
      metalness: 0.05,
    });

    const addBox = (w: number, h: number, d: number, y: number, z = 0, x = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material.clone());
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.entityType = 'furniture';
      mesh.name = this.mesh.name;
      this.mesh.add(mesh);
    };

    switch (catalogId) {
      case 'chair':
        addBox(width, 0.08, depth, 0.42);
        addBox(width, 0.45, 0.06, 0.65, -depth / 2 + 0.03);
        addBox(0.05, 0.42, 0.05, 0.21, depth / 2 - 0.05, width / 2 - 0.05);
        addBox(0.05, 0.42, 0.05, 0.21, depth / 2 - 0.05, -width / 2 + 0.05);
        addBox(0.05, 0.42, 0.05, 0.21, -depth / 2 + 0.05, width / 2 - 0.05);
        addBox(0.05, 0.42, 0.05, 0.21, -depth / 2 + 0.05, -width / 2 + 0.05);
        break;
      case 'table':
      case 'dining-table':
        addBox(width, 0.06, depth, height - 0.03);
        addBox(0.08, height - 0.06, 0.08, (height - 0.06) / 2, depth / 2 - 0.1, width / 2 - 0.1);
        addBox(0.08, height - 0.06, 0.08, (height - 0.06) / 2, depth / 2 - 0.1, -width / 2 + 0.1);
        addBox(0.08, height - 0.06, 0.08, (height - 0.06) / 2, -depth / 2 + 0.1, width / 2 - 0.1);
        addBox(0.08, height - 0.06, 0.08, (height - 0.06) / 2, -depth / 2 + 0.1, -width / 2 + 0.1);
        break;
      case 'bed':
        addBox(width, 0.25, depth, 0.2);
        addBox(width, 0.35, 0.08, 0.45, -depth / 2 + 0.04);
        addBox(width * 0.9, 0.12, depth * 0.35, 0.4, depth / 2 - depth * 0.2);
        break;
      case 'wardrobe':
      case 'shelf':
      case 'nightstand':
        addBox(width, height, depth, height / 2);
        break;
      case 'sofa':
        addBox(width, 0.35, depth, 0.25);
        addBox(width, 0.4, 0.12, 0.55, -depth / 2 + 0.06);
        addBox(0.12, 0.3, depth * 0.9, 0.45, 0, width / 2 - 0.06);
        addBox(0.12, 0.3, depth * 0.9, 0.45, 0, -width / 2 + 0.06);
        break;
      case 'stove':
        addBox(width, height * 0.85, depth, (height * 0.85) / 2);
        addBox(width * 0.9, 0.04, depth * 0.9, height * 0.85 + 0.02);
        break;
      case 'sink':
        addBox(width, height * 0.7, depth, (height * 0.7) / 2);
        addBox(width * 0.85, 0.08, depth * 0.7, height * 0.75);
        break;
      case 'toilet':
        addBox(width * 0.7, height * 0.45, depth * 0.45, height * 0.55, -depth * 0.2);
        addBox(width, height * 0.4, depth * 0.55, height * 0.25, depth * 0.15);
        break;
      case 'bathtub':
        addBox(width, height * 0.7, depth, height * 0.35);
        break;
      case 'floor-lamp':
        addBox(0.06, height * 0.75, 0.06, height * 0.4);
        addBox(width, 0.08, depth, 0.04);
        addBox(width * 0.9, height * 0.2, depth * 0.9, height * 0.85);
        break;
      case 'plant':
        addBox(width * 0.5, height * 0.2, depth * 0.5, height * 0.1);
        addBox(width * 0.15, height * 0.55, depth * 0.15, height * 0.45);
        addBox(width, height * 0.35, depth, height * 0.75);
        break;
      case 'rug':
        addBox(width, Math.max(height, 0.02), depth, Math.max(height, 0.02) / 2);
        break;
      case 'tv':
        addBox(width, height * 0.85, depth, height * 0.55);
        addBox(width * 0.3, height * 0.15, depth * 1.2, height * 0.08);
        break;
      default:
        addBox(width, height, depth, height / 2);
        break;
    }
  }

  private applyMaterial(object: FurnitureObject): void {
    for (const child of this.mesh.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const material = child.material as THREE.MeshStandardMaterial;
      material.color.set(object.color);
      material.map = TextureFactory.get(object.surface);
      material.needsUpdate = true;
    }
  }
}
