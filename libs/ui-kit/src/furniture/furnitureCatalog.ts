import type { FurnitureCatalogId, FurniturePreset } from './types';

/**
 * Built-in furniture presets shared by the catalog UI and editor domain.
 */
export const FURNITURE_CATALOG: readonly FurniturePreset[] = [
  {
    id: 'chair',
    label: 'Стул',
    footprint: { width: 0.5, depth: 0.5 },
    height: 0.9,
    defaultSurface: 'wood',
    defaultColor: '#c9945f',
  },
  {
    id: 'table',
    label: 'Стол',
    footprint: { width: 1.4, depth: 0.8 },
    height: 0.75,
    defaultSurface: 'wood',
    defaultColor: '#b8834a',
  },
  {
    id: 'bed',
    label: 'Кровать',
    footprint: { width: 1.6, depth: 2.0 },
    height: 0.55,
    defaultSurface: 'fabric',
    defaultColor: '#8fa4c8',
  },
  {
    id: 'wardrobe',
    label: 'Шкаф',
    footprint: { width: 1.2, depth: 0.55 },
    height: 2.0,
    defaultSurface: 'wood',
    defaultColor: '#9a6b3f',
  },
];

export function getFurniturePreset(id: FurnitureCatalogId): FurniturePreset {
  const preset = FURNITURE_CATALOG.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Unknown furniture catalog id: ${id}`);
  return preset;
}

export function isFurnitureCatalogId(value: string): value is FurnitureCatalogId {
  return FURNITURE_CATALOG.some((entry) => entry.id === value);
}
