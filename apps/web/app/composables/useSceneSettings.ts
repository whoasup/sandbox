import { reactive } from 'vue';

export const shapeKinds = ['torusKnot', 'torus', 'box', 'sphere', 'icosahedron'] as const;

export type ShapeKind = (typeof shapeKinds)[number];

export interface SceneSettings {
  shape: ShapeKind;
  color: string;
  speed: number;
  wireframe: boolean;
  autoRotate: boolean;
}

export const defaultSceneSettings: SceneSettings = {
  shape: 'torusKnot',
  color: '#6366f1',
  speed: 0.6,
  wireframe: false,
  autoRotate: true,
};

/**
 * Local scene state for a single page. Kept as a composable so the control
 * panel and the canvas can share it without prop drilling through the layout.
 */
export function useSceneSettings(initial: Partial<SceneSettings> = {}) {
  const settings = reactive<SceneSettings>({ ...defaultSceneSettings, ...initial });

  function reset() {
    Object.assign(settings, defaultSceneSettings, initial);
  }

  return { settings, reset };
}
