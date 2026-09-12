import * as THREE from 'three';
import type { Room } from '../../model/Room';
import { TextureFactory } from './TextureFactory';

/**
 * Flat floor mesh for a room polygon (Y ≈ 0). Uses ShapeGeometry from
 * the XZ polygon projected into the XY shape plane then rotated.
 */
export class ThreeRoomFloorMesh {
  public readonly mesh: THREE.Mesh;

  public constructor(room: Room) {
    this.mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 }),
    );
    this.mesh.name = room.id;
    this.mesh.userData.entityType = 'room';
    this.mesh.receiveShadow = true;
    this.update(room);
  }

  public update(room: Room): void {
    this.mesh.name = room.id;
    const shape = new THREE.Shape();
    const first = room.polygon[0];
    if (!first) return;
    shape.moveTo(first.x, first.z);
    for (let i = 1; i < room.polygon.length; i++) {
      const p = room.polygon[i]!;
      shape.lineTo(p.x, p.z);
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    // Slightly above the ground plane so rooms read above the fallback floor.
    geometry.translate(0, 0.005, 0);

    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;

    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.color = new THREE.Color(room.floorColor);
    if (room.floorSurface) {
      material.map = TextureFactory.get(room.floorSurface);
      material.map.needsUpdate = true;
    } else {
      material.map = null;
    }
    material.needsUpdate = true;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
