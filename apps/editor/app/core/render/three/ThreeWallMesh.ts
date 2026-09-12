import { solidWallIntervals } from '@sandbox/editor-core';
import type { Opening, WallObject } from '@sandbox/editor-core';
import * as THREE from 'three';

import { TextureFactory } from './TextureFactory';

/**
 * Segmented wall mesh: solid box spans around openings (no CSG), plus
 * simple door/window frame markers in the gaps.
 */
export class ThreeWallMesh {
  public readonly mesh: THREE.Group;
  private readonly solidMeshes: THREE.Mesh[] = [];
  private readonly openingMeshes: THREE.Mesh[] = [];
  private material: THREE.MeshStandardMaterial;

  public constructor(wall: WallObject) {
    this.mesh = new THREE.Group();
    this.mesh.name = wall.id;
    this.mesh.userData.entityType = 'wall';
    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wall.color),
      map: TextureFactory.get(wall.surface),
      roughness: 0.9,
      metalness: 0.05,
    });
    this.update(wall, []);
  }

  public update(wall: WallObject, openings: readonly Opening[] = []): void {
    this.mesh.name = wall.id;
    this.clearChildren();

    this.material.color.set(wall.color);
    this.material.map = TextureFactory.get(wall.surface);
    this.material.needsUpdate = true;

    const length = Math.max(wall.length, 0.05);
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const angle = wall.angleY;

    const solids = solidWallIntervals(length, openings);
    for (const span of solids) {
      const tMid = (span.t0 + span.t1) / 2;
      const spanLen = (span.t1 - span.t0) * length;
      if (spanLen < 0.02) continue;
      const cx = wall.start.x + dx * tMid;
      const cz = wall.start.z + dz * tMid;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(wall.thickness, wall.height, spanLen),
        this.material,
      );
      box.position.set(cx, wall.height / 2, cz);
      box.rotation.y = angle;
      box.castShadow = true;
      box.receiveShadow = true;
      box.userData.entityType = 'wall';
      box.name = wall.id;
      this.solidMeshes.push(box);
      this.mesh.add(box);
    }

    for (const opening of openings) {
      const half = opening.width / (2 * length);
      const t0 = opening.t - half;
      const t1 = opening.t + half;
      const tMid = (t0 + t1) / 2;
      const cx = wall.start.x + dx * tMid;
      const cz = wall.start.z + dz * tMid;

      // Lintel above opening
      const lintelTop = opening.sill + opening.height;
      const lintelHeight = Math.max(0.05, wall.height - lintelTop);
      if (lintelHeight > 0.04) {
        const lintel = new THREE.Mesh(
          new THREE.BoxGeometry(wall.thickness, lintelHeight, opening.width),
          this.material,
        );
        lintel.position.set(cx, lintelTop + lintelHeight / 2, cz);
        lintel.rotation.y = angle;
        lintel.userData.entityType = 'wall';
        lintel.name = wall.id;
        this.solidMeshes.push(lintel);
        this.mesh.add(lintel);
      }

      // Sill / kick for windows
      if (opening.sill > 0.04) {
        const sill = new THREE.Mesh(
          new THREE.BoxGeometry(wall.thickness, opening.sill, opening.width),
          this.material,
        );
        sill.position.set(cx, opening.sill / 2, cz);
        sill.rotation.y = angle;
        sill.userData.entityType = 'wall';
        sill.name = wall.id;
        this.solidMeshes.push(sill);
        this.mesh.add(sill);
      }

      // Thin frame marker in the opening (pickable as opening)
      const frameMat = new THREE.MeshStandardMaterial({
        color: opening.type === 'door' ? '#8b5a2b' : '#7dd3fc',
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(wall.thickness * 0.35, opening.height * 0.95, opening.width * 0.08),
        frameMat,
      );
      frame.position.set(cx, opening.sill + opening.height / 2, cz);
      frame.rotation.y = angle;
      frame.userData.entityType = 'opening';
      frame.name = opening.id;
      this.openingMeshes.push(frame);
      this.mesh.add(frame);
    }
  }

  public dispose(): void {
    this.clearChildren();
    this.material.dispose();
  }

  private clearChildren(): void {
    for (const child of [...this.mesh.children]) {
      this.mesh.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material !== this.material) {
          (child.material as THREE.Material).dispose();
        }
      }
    }
    this.solidMeshes.length = 0;
    this.openingMeshes.length = 0;
  }
}
