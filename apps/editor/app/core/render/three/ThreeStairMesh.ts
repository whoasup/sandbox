import * as THREE from 'three';
import type { StairObject } from '@sandbox/editor-core';

/** Stacked box steps for a simple rectangular stair flight. */
export class ThreeStairMesh {
  public readonly mesh: THREE.Group;

  public constructor(stair: StairObject) {
    this.mesh = new THREE.Group();
    this.mesh.name = stair.id;
    this.mesh.userData.entityType = 'stair';
    this.rebuild(stair);
  }

  public update(stair: StairObject): void {
    this.rebuild(stair);
  }

  public dispose(): void {
    this.clear();
  }

  private clear(): void {
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

  private rebuild(stair: StairObject): void {
    this.clear();
    this.mesh.name = stair.id;
    this.mesh.position.set(stair.position.x, 0, stair.position.z);
    this.mesh.rotation.y = stair.rotationY;

    const steps = Math.max(3, stair.stepCount);
    const stepDepth = stair.depth / steps;
    const stepHeight = 0.18;
    const material = new THREE.MeshStandardMaterial({
      color: stair.direction === 'up' ? 0xc4b8a8 : 0xb0a090,
      roughness: 0.9,
      metalness: 0.05,
    });

    for (let i = 0; i < steps; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(stair.width, stepHeight, stepDepth * 0.95),
        material.clone(),
      );
      const z = -stair.depth / 2 + stepDepth * (i + 0.5);
      const y = stepHeight / 2 + i * stepHeight;
      mesh.position.set(0, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.entityType = 'stair';
      mesh.name = stair.id;
      this.mesh.add(mesh);
    }
  }
}
