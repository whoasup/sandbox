import { describe, expect, it } from 'vitest';
import { FURNITURE_CATALOG, getFurniturePreset, isFurnitureCatalogId } from './furnitureCatalog';

describe('FURNITURE_CATALOG', () => {
  it('resolves all four preset ids', () => {
    expect(FURNITURE_CATALOG).toHaveLength(4);
    for (const id of ['chair', 'table', 'bed', 'wardrobe'] as const) {
      expect(getFurniturePreset(id).id).toBe(id);
      expect(isFurnitureCatalogId(id)).toBe(true);
    }
  });

  it('exposes Russian labels and positive dimensions', () => {
    for (const preset of FURNITURE_CATALOG) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.footprint.width).toBeGreaterThan(0);
      expect(preset.footprint.depth).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });
});
