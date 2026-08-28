import * as THREE from 'three';
import { SHAPE_DIMENSIONS } from '../../model/shapeDimensions';
import type { SceneObject } from '../../model/SceneObject';
import type { ShapeKind } from '../../model/types';
import { TextureFactory } from './TextureFactory';

/**
 * Translates the framework-agnostic `SceneObject` model into three.js
 * primitives. Kept as static factory methods (no internal state) so it
 * can be unit tested without a WebGL context.
 */
export class ThreeMeshFactory {
  public static createGeometry(kind: ShapeKind): THREE.BufferGeometry {
    const dimensions = SHAPE_DIMENSIONS[kind];

    switch (kind) {
      case 'cube':
        return new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
      case 'sphere':
        return new THREE.SphereGeometry(dimensions.width / 2, 32, 24);
      case 'cylinder':
        return new THREE.CylinderGeometry(
          dimensions.width / 2,
          dimensions.width / 2,
          dimensions.height,
          32,
        );
      case 'pyramid': {
        const geometry = new THREE.ConeGeometry(
          dimensions.width / Math.SQRT2,
          dimensions.height,
          4,
        );
        geometry.rotateY(Math.PI / 4);
        return geometry;
      }
    }
  }

  public static createMaterial(object: SceneObject): THREE.Material {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(object.color),
      map: TextureFactory.get(object.surface),
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  public static createMesh(object: SceneObject): THREE.Mesh {
    const mesh = new THREE.Mesh(
      ThreeMeshFactory.createGeometry(object.kind),
      ThreeMeshFactory.createMaterial(object),
    );
    mesh.name = object.id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ThreeMeshFactory.applyTransform(mesh, object);
    return mesh;
  }

  public static applyTransform(mesh: THREE.Mesh, object: SceneObject): void {
    mesh.position.set(object.position.x, object.position.y, object.position.z);
    mesh.rotation.y = object.rotationY;
    mesh.scale.setScalar(object.scale);
  }

  /** Updates an existing mesh's transform + material to match `object`, reusing the geometry. */
  public static updateMesh(mesh: THREE.Mesh, object: SceneObject): void {
    ThreeMeshFactory.applyTransform(mesh, object);
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.color.set(object.color);
    material.map = TextureFactory.get(object.surface);
    material.needsUpdate = true;
  }
}
