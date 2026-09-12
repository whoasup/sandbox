# Epic 03 — Object inspector and replace kind

Status: **implemented** — branch `epic/03-object-inspector`  
Branch: `epic/03-object-inspector`  
Depends on: Epic 01  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Expose a **right-hand object inspector** for the selected shape:
   surface, color, rotation, scale, duplicate, and **replace kind**.
2. Add `SceneDocument.replaceKind(id, kind)` so swapping cube → sphere
   (etc.) keeps id, position, rotation, scale, surface, and color.
3. Ensure both SVG and Three renderers **rebuild** the visual when `kind`
   changes, not only on move/color updates.

## 2. User stories

- As a user, I select a shape and change its type without recreating it
  from scratch.
- As a user, I rotate and scale the selection with controls and see the
  result in both 2D and 3D.
- As a user, I duplicate the selection into a new object near the original.

## 3. Domain changes

### `SceneDocument.replaceKind(id, kind)`

1. Load existing object; if missing or unsupported kind → no-op / throw
   (pick one and test it).
2. Snapshot: `id`, `position`, `rotationY`, `scale`, `surface`, `color`.
3. Remove old instance; `ShapeFactory.create(kind, { …snapshot })` with
   the **same** `id`.
4. Emit `change` (and keep selection on that id).

Also expose (if not already):

- `setRotationY(id, value)` / `setScale(id, value)` — or route through
  existing object setters + document event
- `duplicate(id)` — new id, offset placement (reuse `nextPlacement` or
  small delta)

`rotationY` / `scale` already live on
[`SceneObject`](../../apps/editor/app/core/model/SceneObject.ts) —
wire them through the document API and Vue bridge.

### Vue bridge (`useEditorDocument`)

Add reactive actions used by the inspector: `replaceSelectedKind`,
`setSelectedRotation`, `setSelectedScale`, `duplicateSelected`, plus
any missing surface/color paths already present.

## 4. UI

- New `EditorInspector.vue` (right panel), visible when `selectedId` is
  set; empty state when nothing selected.
- Kind row: `UiShapeIcon` + buttons/toggle over `SHAPE_CATALOG`.
- Surface: existing `UiTextureSwatch` pattern from toolbar.
- Color: color input.
- Rotation / scale: sliders or numeric inputs (degrees for Y rotation;
  scale clamped to a sensible range, e.g. 0.25–4).
- Actions: Duplicate; Delete can stay on toolbar or move into inspector
  (prefer inspector + keep toolbar delete for muscle memory).
- **Do not** stuff all of this into `EditorToolbar` — toolbar stays for
  mode, add-shape, and coarse actions.

## 5. Files to touch (expected)

- `apps/editor/app/core/model/SceneDocument.ts` (+ specs)
- `apps/editor/app/core/model/ShapeFactory.ts` if create-with-id needs
  tightening
- `apps/editor/app/composables/useEditorDocument.ts` (+ specs)
- `apps/editor/app/components/EditorInspector.vue` (+ specs)
- `apps/editor/app/pages/editor/[projectId].vue` — layout: toolbar /
  canvas / inspector
- `apps/editor/app/core/render/svg/SvgRenderer.ts` / `Svg2DShapeView.ts`
- `apps/editor/app/core/render/three/ThreeRenderer.ts` /
  `ThreeMeshFactory.ts` — recreate mesh/view on kind change

## 6. Tests

- Unit: `replaceKind` preserves transform/material fields and id
- Unit: duplicate creates a second object with new id
- Component: inspector enables controls only when selected; kind click
  calls replace
- Renderer factory: kind swap produces correct geometry class/type

## 7. Definition of Done

- [x] Cube → sphere keeps transform and material
- [x] Rotation / scale controls affect both 2D and 3D views
- [x] Duplicate works; selection updates appropriately
- [x] Specs cover `replaceKind` and inspector happy path
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Wall / room / opening inspectors (later epics)
- Scene-level background / field panel (Epic 04)
- Undo stack (Epic 09) — mutations should still be pure enough to wrap
  later
- Multi-select
