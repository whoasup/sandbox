import { describe, expect, it } from 'vitest';
import { ShapeFactory } from './ShapeFactory';
import { CubeObject } from './shapes/CubeObject';
import { CylinderObject } from './shapes/CylinderObject';
import { PyramidObject } from './shapes/PyramidObject';
import { SphereObject } from './shapes/SphereObject';

describe('ShapeFactory', () => {
  it.each([
    ['cube', CubeObject],
    ['sphere', SphereObject],
    ['cylinder', CylinderObject],
    ['pyramid', PyramidObject],
  ] as const)('creates a %s as an instance of %s', (kind, Ctor) => {
    const shape = ShapeFactory.create(kind);
    expect(shape).toBeInstanceOf(Ctor);
    expect(shape.kind).toBe(kind);
  });

  it('applies initial params to the created shape', () => {
    const shape = ShapeFactory.create('cube', { position: { x: 1, z: 2 }, surface: 'stone', color: '#abcdef' });
    expect(shape.position.x).toBe(1);
    expect(shape.position.z).toBe(2);
    expect(shape.surface).toBe('stone');
    expect(shape.color).toBe('#abcdef');
  });

  it('throws for unknown shape kinds', () => {
    // @ts-expect-error -- intentionally invalid kind to exercise the guard
    expect(() => ShapeFactory.create('cone')).toThrow(/unknown shape kind/i);
  });

  it('reports which kinds it supports', () => {
    expect(ShapeFactory.supports('cube')).toBe(true);
    expect(ShapeFactory.supports('cone')).toBe(false);
  });
});
