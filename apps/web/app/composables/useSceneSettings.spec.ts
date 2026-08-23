import { describe, expect, it } from 'vitest';

import { defaultSceneSettings, shapeKinds, useSceneSettings } from './useSceneSettings';

describe('useSceneSettings', () => {
  it('starts from the defaults', () => {
    const { settings } = useSceneSettings();
    expect(settings).toEqual(defaultSceneSettings);
  });

  it('accepts partial overrides', () => {
    const { settings } = useSceneSettings({ shape: 'box', speed: 2 });
    expect(settings.shape).toBe('box');
    expect(settings.speed).toBe(2);
    expect(settings.color).toBe(defaultSceneSettings.color);
  });

  it('returns independent state per call', () => {
    const a = useSceneSettings();
    const b = useSceneSettings();
    a.settings.shape = 'sphere';
    expect(b.settings.shape).toBe(defaultSceneSettings.shape);
  });

  it('resets back to the initial overrides', () => {
    const { settings, reset } = useSceneSettings({ shape: 'torus' });

    settings.shape = 'icosahedron';
    settings.wireframe = true;
    reset();

    expect(settings.shape).toBe('torus');
    expect(settings.wireframe).toBe(defaultSceneSettings.wireframe);
  });

  it('exposes every shape the scene can render', () => {
    expect(shapeKinds).toContain(defaultSceneSettings.shape);
    expect(new Set(shapeKinds).size).toBe(shapeKinds.length);
  });
});
