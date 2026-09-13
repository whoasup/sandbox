import type { FurnitureCatalogId, FurnitureCategory, FurniturePreset } from './types';

/**
 * Built-in furniture presets shared by the catalog UI and editor domain.
 */
export const FURNITURE_CATALOG: readonly FurniturePreset[] = [
  {
    id: 'chair',
    label: 'Стул',
    category: 'living',
    footprint: { width: 0.5, depth: 0.5 },
    height: 0.9,
    defaultSurface: 'wood',
    defaultColor: '#c9945f',
  },
  {
    id: 'table',
    label: 'Стол',
    category: 'living',
    footprint: { width: 1.4, depth: 0.8 },
    height: 0.75,
    defaultSurface: 'wood',
    defaultColor: '#b8834a',
  },
  {
    id: 'sofa',
    label: 'Диван',
    category: 'living',
    footprint: { width: 2.1, depth: 0.9 },
    height: 0.85,
    defaultSurface: 'fabric',
    defaultColor: '#6b7c93',
  },
  {
    id: 'tv',
    label: 'ТВ',
    category: 'living',
    footprint: { width: 1.2, depth: 0.12 },
    height: 0.7,
    defaultSurface: 'stone',
    defaultColor: '#2a2d34',
  },
  {
    id: 'shelf',
    label: 'Стеллаж',
    category: 'living',
    footprint: { width: 1.0, depth: 0.35 },
    height: 1.8,
    defaultSurface: 'wood',
    defaultColor: '#a67848',
  },
  {
    id: 'bed',
    label: 'Кровать',
    category: 'bedroom',
    footprint: { width: 1.6, depth: 2.0 },
    height: 0.55,
    defaultSurface: 'fabric',
    defaultColor: '#8fa4c8',
  },
  {
    id: 'wardrobe',
    label: 'Шкаф',
    category: 'bedroom',
    footprint: { width: 1.2, depth: 0.55 },
    height: 2.0,
    defaultSurface: 'wood',
    defaultColor: '#9a6b3f',
  },
  {
    id: 'nightstand',
    label: 'Тумбочка',
    category: 'bedroom',
    footprint: { width: 0.45, depth: 0.4 },
    height: 0.55,
    defaultSurface: 'wood',
    defaultColor: '#b07a4a',
  },
  {
    id: 'dining-table',
    label: 'Обед. стол',
    category: 'kitchen',
    footprint: { width: 1.6, depth: 0.9 },
    height: 0.75,
    defaultSurface: 'wood',
    defaultColor: '#a8733f',
  },
  {
    id: 'stove',
    label: 'Плита',
    category: 'kitchen',
    footprint: { width: 0.6, depth: 0.6 },
    height: 0.9,
    defaultSurface: 'stone',
    defaultColor: '#5a5e66',
  },
  {
    id: 'sink',
    label: 'Раковина',
    category: 'kitchen',
    footprint: { width: 0.6, depth: 0.5 },
    height: 0.85,
    defaultSurface: 'stone',
    defaultColor: '#c5ccd4',
  },
  {
    id: 'toilet',
    label: 'Унитаз',
    category: 'bath',
    footprint: { width: 0.4, depth: 0.65 },
    height: 0.75,
    defaultSurface: 'stone',
    defaultColor: '#e8ecef',
  },
  {
    id: 'bathtub',
    label: 'Ванна',
    category: 'bath',
    footprint: { width: 0.75, depth: 1.7 },
    height: 0.55,
    defaultSurface: 'stone',
    defaultColor: '#dfe5ea',
  },
  {
    id: 'floor-lamp',
    label: 'Торшер',
    category: 'lighting',
    footprint: { width: 0.35, depth: 0.35 },
    height: 1.6,
    defaultSurface: 'fabric',
    defaultColor: '#e8d9b5',
  },
  {
    id: 'plant',
    label: 'Растение',
    category: 'decor',
    footprint: { width: 0.4, depth: 0.4 },
    height: 1.1,
    defaultSurface: 'fabric',
    defaultColor: '#4f8f5b',
  },
  {
    id: 'rug',
    label: 'Ковёр',
    category: 'decor',
    footprint: { width: 2.0, depth: 1.4 },
    height: 0.03,
    defaultSurface: 'fabric',
    defaultColor: '#8b5e4b',
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

export interface FilterFurnitureCatalogOptions {
  category?: FurnitureCategory | 'all';
  query?: string;
}

/** Filter catalog by category and/or free-text query (id / label). */
export function filterFurnitureCatalog(
  options: FilterFurnitureCatalogOptions = {},
): FurniturePreset[] {
  const category = options.category ?? 'all';
  const query = (options.query ?? '').trim().toLowerCase();

  return FURNITURE_CATALOG.filter((preset) => {
    if (category !== 'all' && preset.category !== category) return false;
    if (!query) return true;
    return (
      preset.id.toLowerCase().includes(query) ||
      preset.label.toLowerCase().includes(query) ||
      preset.category.toLowerCase().includes(query)
    );
  });
}
