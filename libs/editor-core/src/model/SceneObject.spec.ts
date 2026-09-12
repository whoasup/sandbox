import { describe, expect, it } from 'vitest';
import { SHAPE_DIMENSIONS } from './shapeDimensions';
import { CubeObject } from './shapes/CubeObject';
import { SphereObject } from './shapes/SphereObject';

describe('SceneObject', () => {
  it('defaults to sitting on the floor at the origin', () => {
    const cube = new CubeObject();
    expect(cube.position).toEqual({ x: 0, y: SHAPE_DIMENSIONS.cube.height / 2, z: 0 });
  });

  it('scales the resting height and footprint together', () => {
    const sphere = new SphereObject({ scale: 2 });
    expect(sphere.restingHeight).toBe(SHAPE_DIMENSIONS.sphere.height);
    expect(sphere.footprint).toEqual({
      width: SHAPE_DIMENSIONS.sphere.width * 2,
      depth: SHAPE_DIMENSIONS.sphere.depth * 2,
    });
  });

  it('keeps the shape resting on the floor after moving', () => {
    const cube = new CubeObject();
    cube.moveTo(5, -3);
    expect(cube.position).toEqual({ x: 5, y: cube.restingHeight, z: -3 });
  });

  it('serialises to a plain snapshot', () => {
    const cube = new CubeObject({ id: 'shape_1', surface: 'fabric', color: '#112233' });
    expect(cube.toSnapshot()).toEqual({
      id: 'shape_1',
      kind: 'cube',
      position: cube.position,
      rotationY: 0,
      scale: 1,
      surface: 'fabric',
      color: '#112233',
    });
  });
});
