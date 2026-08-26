import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CubeObject } from '../../model/shapes/CubeObject';
import { CylinderObject } from '../../model/shapes/CylinderObject';
import { PyramidObject } from '../../model/shapes/PyramidObject';
import { SphereObject } from '../../model/shapes/SphereObject';
import { ThreeMeshFactory } from './ThreeMeshFactory';

describe('ThreeMeshFactory', () => {
  it('creates a box geometry for cubes', () => {
    const geometry = ThreeMeshFactory.createGeometry('cube');
    expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  it('creates matching geometries for every shape kind', () => {
    expect(ThreeMeshFactory.createGeometry('sphere')).toBeInstanceOf(THREE.SphereGeometry);
    expect(ThreeMeshFactory.createGeometry('cylinder')).toBeInstanceOf(THREE.CylinderGeometry);
    expect(ThreeMeshFactory.createGeometry('pyramid')).toBeInstanceOf(THREE.ConeGeometry);
  });

  it('builds a mesh named after the object id, positioned to match it', () => {
    const object = new CubeObject({ id: 'shape_42', position: { x: 1, z: -2 }, scale: 1.5 });
    const mesh = ThreeMeshFactory.createMesh(object);

    expect(mesh.name).toBe('shape_42');
    expect(mesh.position.x).toBe(1);
    expect(mesh.position.z).toBe(-2);
    expect(mesh.position.y).toBe(object.restingHeight);
    expect(mesh.scale.x).toBe(1.5);
  });

  it('updates an existing mesh transform and material in place', () => {
    const object = new SphereObject({ color: '#ff0000', surface: 'wood' });
    const mesh = ThreeMeshFactory.createMesh(object);

    object.moveTo(4, 4);
    object.setColor('#00ff00');
    object.setSurface('stone');
    ThreeMeshFactory.updateMesh(mesh, object);

    expect(mesh.position.x).toBe(4);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.color.getHexString()).toBe('00ff00');
  });

  it.each([new CubeObject(), new SphereObject(), new CylinderObject(), new PyramidObject()])(
    'creates a mesh for %#',
    (object) => {
      const mesh = ThreeMeshFactory.createMesh(object);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
    }
  );
});
