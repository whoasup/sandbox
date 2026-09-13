import { describe, expect, it } from 'vitest';
import {
  FURNITURE_CATALOG,
  filterFurnitureCatalog,
  getFurniturePreset,
  isFurnitureCatalogId,
} from './furnitureCatalog';
import { FURNITURE_CATEGORIES } from './types';

describe('FURNITURE_CATALOG', () => {
  it('resolves at least 12 presets across categories', () => {
    expect(FURNITURE_CATALOG.length).toBeGreaterThanOrEqual(12);
    const categories = new Set(FURNITURE_CATALOG.map((p) => p.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
    for (const category of FURNITURE_CATEGORIES) {
      expect(typeof category).toBe('string');
    }
    for (const id of ['chair', 'table', 'bed', 'wardrobe'] as const) {
      expect(getFurniturePreset(id).id).toBe(id);
      expect(isFurnitureCatalogId(id)).toBe(true);
    }
  });

  it('exposes Russian labels, categories, and positive dimensions', () => {
    for (const preset of FURNITURE_CATALOG) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(FURNITURE_CATEGORIES).toContain(preset.category);
      expect(preset.footprint.width).toBeGreaterThan(0);
      expect(preset.footprint.depth).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });

  it('filters by category and query', () => {
    const kitchen = filterFurnitureCatalog({ category: 'kitchen' });
    expect(kitchen.length).toBeGreaterThan(0);
    expect(kitchen.every((p) => p.category === 'kitchen')).toBe(true);

    const sofa = filterFurnitureCatalog({ query: 'диван' });
    expect(sofa.map((p) => p.id)).toContain('sofa');

    const all = filterFurnitureCatalog({ category: 'all', query: '' });
    expect(all).toHaveLength(FURNITURE_CATALOG.length);

    const empty = filterFurnitureCatalog({ query: 'zzz-no-match' });
    expect(empty).toHaveLength(0);
  });
});
