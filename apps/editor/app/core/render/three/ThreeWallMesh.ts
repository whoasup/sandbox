import * as THREE from 'three';
import type { WallObject } from '../../model/WallObject';
import { TextureFactory } from './TextureFactory';

/**
 * Extruded box mesh along a wall segment, resting on the floor plane.
 */
export class ThreeWallMesh {
  public readonly mesh: THREE.Mesh;

  public constructor(wall: WallObject) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wall.color),
      map: TextureFactory.get(wall.surface),
      roughness: 0.9,
      metalness: 0.05,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = wall.id;
    this.mesh.userData.entityType = 'wall';
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.update(wall);
  }

  public update(wall: WallObject): void {
    const length = Math.max(wall.length, 0.05);
    const mid = wall.midpoint;
    this.mesh.position.set(mid.x, wall.height / 2, mid.z);
    this.mesh.rotation.y = wall.angleY;
    this.mesh.scale.set(wall.thickness, wall.height, length);

    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.color.set(wall.color);
    material.map = TextureFactory.get(wall.surface);
    material.needsUpdate = true;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
