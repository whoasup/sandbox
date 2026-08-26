export type SurfaceKind = 'wood' | 'fabric' | 'stone';

export type TexturePatternKind = 'stripes' | 'grid' | 'dots';

export interface TextureDefinition {
  readonly id: SurfaceKind;
  readonly label: string;
  readonly pattern: TexturePatternKind;
  readonly baseColor: string;
  readonly accentColor: string;
}
