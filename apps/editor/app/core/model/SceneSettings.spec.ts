import { describe, expect, it } from 'vitest';
import {
  cloneSceneSettings,
  createDefaultSceneSettings,
  mergeSceneSettings,
  resolveBackgroundColor,
  roundToStep,
} from './SceneSettings';

describe('SceneSettings helpers', () => {
  it('defaults to a 20×20 studio field with grid on and snap off', () => {
    const defaults = createDefaultSceneSettings();
    expect(defaults.field.width).toBe(20);
    expect(defaults.field.depth).toBe(20);
    expect(defaults.field.gridVisible).toBe(true);
    expect(defaults.field.snap).toBe(false);
    expect(defaults.background.mode).toBe('preset');
    expect(defaults.background.preset).toBe('studio');
  });

  it('resolves preset and custom background colors', () => {
    expect(resolveBackgroundColor({ mode: 'preset', color: '#000', preset: 'night' })).toBe(
      '#1a1f2a',
    );
    expect(resolveBackgroundColor({ mode: 'color', color: '#ff00aa' })).toBe('#ff00aa');
  });

  it('roundToStep snaps values to the grid', () => {
    expect(roundToStep(1.4, 1)).toBe(1);
    expect(roundToStep(1.6, 1)).toBe(2);
    expect(roundToStep(2.4, 0.5)).toBe(2.5);
    expect(roundToStep(3, 0)).toBe(3);
  });

  it('mergeSceneSettings deep-merges nested patches', () => {
    const base = createDefaultSceneSettings();
    const merged = mergeSceneSettings(base, {
      field: { snap: true, gridStep: 0.5 },
      background: { mode: 'color', color: '#112233' },
    });
    expect(merged.field.snap).toBe(true);
    expect(merged.field.gridStep).toBe(0.5);
    expect(merged.field.width).toBe(20);
    expect(merged.background.mode).toBe('color');
    expect(merged.background.color).toBe('#112233');
    expect(base.field.snap).toBe(false);
  });

  it('cloneSceneSettings returns a deep copy', () => {
    const original = createDefaultSceneSettings();
    const copy = cloneSceneSettings(original);
    copy.field.snap = true;
    expect(original.field.snap).toBe(false);
  });
});
