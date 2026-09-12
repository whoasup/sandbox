# Epic 04 — Scene background and field settings

Status: **planned**  
Branch: `epic/04-scene-environment`  
Depends on: Epic 01  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Introduce document-level **`SceneSettings`** (background, placement
   field, default floor look) separate from per-object properties.
2. Drive 2D grid / canvas background and 3D ground / clear color /
   `GridHelper` from those settings.
3. Optional **snap-to-grid** while dragging when `field.snap` is true.

## 2. User stories

- As a user, I change the scene background (solid color or preset) and
  see it immediately in 2D and 3D.
- As a user, I resize the placement field, toggle grid / axes, and change
  grid step.
- As a user, I enable snap and dragged shapes stick to the grid.

## 3. Domain changes

Add settings on the document (not on each `SceneObject`):

```ts
interface SceneSettings {
  background: {
    mode: 'color' | 'preset';
    color: string;
    preset?: 'studio' | 'night' | 'day';
  };
  field: {
    width: number;
    depth: number;
    gridVisible: boolean;
    gridStep: number;
    snap: boolean;
    axesVisible: boolean;
  };
  floor: {
    color: string;
    surface?: SurfaceKind;
  };
}
```

- `SceneDocument` owns settings + getters/setters (`updateSettings`,
  `patchSettings`) and emits `change` (or a dedicated `settings` event —
  prefer one `change` stream unless consumers need finer grain).
- Defaults: reasonable room-scale field (e.g. 20×20), grid step `1`,
  grid visible, snap off, studio-like background.
- Snapshot shape for Epic 05: `objects[]` + `settings` (document this
  now even if persistence lands later).

Preset resolution (example — implement consistently in both renderers):

| Preset | Intent |
|--------|--------|
| `studio` | Neutral light grey clear / SVG bg |
| `day` | Cool light sky |
| `night` | Dark clear color |

When `mode === 'color'`, use `background.color` directly.

## 4. UI

- New panel **«Сцена / поле»** (`EditorScenePanel.vue`) — distinct from
  the object inspector (Epic 03). Can sit in a left drawer, bottom sheet,
  or tab next to inspector; must not replace object inspector.
- Controls: background mode + color/preset; field width/depth; grid
  visible/step; snap; axes; floor color / optional surface swatch.
- Read/write through `useEditorDocument` settings refs.

## 5. Files to touch (expected)

- `apps/editor/app/core/model/SceneSettings.ts` (new) + defaults
- `apps/editor/app/core/model/SceneDocument.ts` (+ specs)
- `apps/editor/app/core/model/types.ts` — snapshot types
- `apps/editor/app/composables/useEditorDocument.ts`
- `apps/editor/app/components/EditorScenePanel.vue` (+ specs)
- `apps/editor/app/core/render/svg/SvgRenderer.ts` — bg, grid bounds/step
- `apps/editor/app/core/render/three/ThreeRenderer.ts` — clear color,
  ground plane size/material, grid helper
- Drag path in both renderers / document `moveShape` — apply snap when
  enabled

## 6. Tests

- Unit: defaults, patchSettings merge, snap helper (`roundToStep`)
- Unit: document emits after settings change
- Component: toggling grid / snap updates bound state
- Optional renderer unit: snap coordinates

## 7. Definition of Done

- [ ] Background and field size update in both views without reload
- [ ] Grid visibility / step / axes behave as configured
- [ ] Snap affects drag when enabled
- [ ] Settings are part of the in-memory document snapshot API ready for
      Epic 05
- [ ] Green lint / typecheck / test / build

## 8. Out of scope

- Per-room floor materials (Epic 07) — this epic is **scene default**
  floor look only
- Persisting to IndexedDB (Epic 05)
- Walls / openings
- Environment maps / HDRI / skyboxes beyond simple color presets
