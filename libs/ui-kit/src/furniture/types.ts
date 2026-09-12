import type { SurfaceKind } from '../textures/types';

export type FurnitureCatalogId = 'chair' | 'table' | 'bed' | 'wardrobe';

export interface FurniturePreset {
  readonly id: FurnitureCatalogId;
  readonly label: string;
  readonly footprint: { readonly width: number; readonly depth: number };
  readonly height: number;
  readonly defaultSurface: SurfaceKind;
  readonly defaultColor: string;
}
