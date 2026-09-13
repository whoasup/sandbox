import { describe, expect, it } from 'vitest';
import { FurnitureObject } from '@sandbox/editor-core';
import { FURNITURE_CATALOG } from '@sandbox/ui-kit';
import { ThreeFurnitureMesh } from './ThreeFurnitureMesh';

describe('ThreeFurnitureMesh', () => {
  it.each(FURNITURE_CATALOG.map((preset) => preset.id))('builds mesh parts for %s', (catalogId) => {
    const object = new FurnitureObject({ catalogId });
    const view = new ThreeFurnitureMesh(object);
    expect(view.mesh.children.length).toBeGreaterThan(0);
    expect(view.mesh.scale.x).toBeCloseTo(1);
    expect(view.mesh.scale.y).toBeCloseTo(1);
    expect(view.mesh.scale.z).toBeCloseTo(1);
    view.dispose();
  });

  it('applies non-uniform scale from object sizes', () => {
    const object = new FurnitureObject({
      catalogId: 'table',
      width: 2.8,
      depth: 0.8,
      height: 0.75,
    });
    const view = new ThreeFurnitureMesh(object);
    expect(view.mesh.scale.x).toBeCloseTo(2);
    expect(view.mesh.scale.y).toBeCloseTo(1);
    expect(view.mesh.scale.z).toBeCloseTo(1);
    view.dispose();
  });
});
