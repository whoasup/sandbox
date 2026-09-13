import type { SurfaceKind } from './types';

export type BackgroundPreset = 'studio' | 'night' | 'day';

export interface SceneBackgroundSettings {
  mode: 'color' | 'preset';
  color: string;
  preset?: BackgroundPreset;
}

export interface SceneFieldSettings {
  width: number;
  depth: number;
  gridVisible: boolean;
  gridStep: number;
  snap: boolean;
  axesVisible: boolean;
  /** Auto wall length labels on the 2D plan (Epic 18). */
  wallLengthsVisible: boolean;
  /** Room name + area labels on the 2D plan (Epic 18). */
  roomAreasVisible: boolean;
  /** North compass rose on the 2D plan (Epic 18). */
  compassVisible: boolean;
}

export interface SceneFloorSettings {
  color: string;
  surface?: SurfaceKind;
}

export interface SceneSettings {
  background: SceneBackgroundSettings;
  field: SceneFieldSettings;
  floor: SceneFloorSettings;
}

export const BACKGROUND_PRESET_COLORS: Record<BackgroundPreset, string> = {
  studio: '#e7ebf0',
  day: '#cfe8f7',
  night: '#1a1f2a',
};

export function createDefaultSceneSettings(): SceneSettings {
  return {
    background: {
      mode: 'preset',
      color: BACKGROUND_PRESET_COLORS.studio,
      preset: 'studio',
    },
    field: {
      width: 20,
      depth: 20,
      gridVisible: true,
      gridStep: 1,
      snap: false,
      axesVisible: true,
      wallLengthsVisible: true,
      roomAreasVisible: true,
      compassVisible: false,
    },
    floor: {
      color: '#d7dbe0',
      surface: undefined,
    },
  };
}

export function resolveBackgroundColor(settings: SceneBackgroundSettings): string {
  if (settings.mode === 'color') return settings.color;
  const preset = settings.preset ?? 'studio';
  return BACKGROUND_PRESET_COLORS[preset];
}

/** Snap a world coordinate to the nearest multiple of `step`. */
export function roundToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  return Math.round(value / step) * step;
}

export type SceneSettingsPatch = {
  background?: Partial<SceneBackgroundSettings>;
  field?: Partial<SceneFieldSettings>;
  floor?: Partial<SceneFloorSettings>;
};

export function mergeSceneSettings(
  current: SceneSettings,
  patch: SceneSettingsPatch,
): SceneSettings {
  return {
    background: { ...current.background, ...patch.background },
    field: { ...current.field, ...patch.field },
    floor: { ...current.floor, ...patch.floor },
  };
}

export function cloneSceneSettings(settings: SceneSettings): SceneSettings {
  return {
    background: { ...settings.background },
    field: { ...settings.field },
    floor: { ...settings.floor },
  };
}
