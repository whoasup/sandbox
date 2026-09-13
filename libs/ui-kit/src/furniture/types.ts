import type { SurfaceKind } from '../textures/types';

export type FurnitureCategory = 'living' | 'bedroom' | 'kitchen' | 'bath' | 'lighting' | 'decor';

export type FurnitureCatalogId =
  | 'chair'
  | 'table'
  | 'bed'
  | 'wardrobe'
  | 'sofa'
  | 'nightstand'
  | 'dining-table'
  | 'stove'
  | 'sink'
  | 'toilet'
  | 'bathtub'
  | 'floor-lamp'
  | 'plant'
  | 'rug'
  | 'tv'
  | 'shelf';

export interface FurniturePreset {
  readonly id: FurnitureCatalogId;
  readonly label: string;
  readonly category: FurnitureCategory;
  readonly footprint: { readonly width: number; readonly depth: number };
  readonly height: number;
  readonly defaultSurface: SurfaceKind;
  readonly defaultColor: string;
}

export const FURNITURE_CATEGORIES: readonly FurnitureCategory[] = [
  'living',
  'bedroom',
  'kitchen',
  'bath',
  'lighting',
  'decor',
] as const;

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  living: 'Гостиная',
  bedroom: 'Спальня',
  kitchen: 'Кухня',
  bath: 'Ванная',
  lighting: 'Свет',
  decor: 'Декор',
};
