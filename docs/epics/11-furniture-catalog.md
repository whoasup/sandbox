# Epic 11 — Furniture catalog

Status: **implemented**  
Branch: `epic/11-furniture-catalog`  
Depends on: Epic 10  
Owners: `apps/editor` + `libs/ui-kit` (catalog icons / preset metadata)

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Ship a **small built-in furniture catalog** (not a marketplace): chair,
   table, bed, and wardrobe as placeable presets.
2. Store instances in a dedicated **`furniture` collection** on the floor
   document (same pattern as walls — not `ShapeKind`).
3. Persist furniture in snapshots with a `schemaVersion` bump + migration.

## 2. User stories

- As a user, I open a catalog panel, pick «Стул» / «Стол» / «Кровать» /
  «Шкаф», and place it on the floor in 2D or 3D.
- As a user, I select furniture, rotate / scale / recolor it in the
  inspector, and delete or duplicate it.
- As a user, I reload the project and furniture stays where I left it.

## 3. Domain changes

### Catalog (ui-kit or editor-core metadata)

```ts
type FurnitureCatalogId = 'chair' | 'table' | 'bed' | 'wardrobe';

interface FurniturePreset {
  id: FurnitureCatalogId;
  label: string; // RU labels in UI
  footprint: { width: number; depth: number };
  height: number;
  defaultSurface: SurfaceKind;
  defaultColor: string;
}
```

Export `FURNITURE_CATALOG` / `getFurniturePreset(id)` from ui-kit (icons +
labels + dimensions) so Storybook/docs can show them later. Instance
logic stays in the editor domain.

### Instances (editor domain)

```ts
// Floor / SceneDocument collections
shapes: Map<string, SceneObject>
walls: Map<string, WallObject>
furniture: Map<string, FurnitureObject>

interface FurnitureObject {
  id: string;
  catalogId: FurnitureCatalogId;
  position: { x: number; y: number; z: number }; // y from resting height
  rotationY: number;
  scale: number;
  surface: SurfaceKind;
  color: string;
}
```

- Placement: click-to-place tool (like adding a shape); snap uses Epic 04
  / 09 rules when enabled.
- Document API: `addFurniture`, `moveFurniture`, `setFurnitureTransform`,
  `setFurnitureMaterial`, `removeFurniture`, `duplicateFurniture`.
- Selection extends to `{ type: 'furniture'; id }` alongside shape / wall.
- Geometry in 3D: simple composed boxes / primitives per preset (no
  external glTF assets required in this epic). 2D: labeled footprint
  rectangle + optional icon.

### Snapshot

- Bump `schemaVersion`; migration adds `furniture: []` on each floor
  snapshot.

## 4. UI

- Catalog panel (left drawer or toolbar popover): four presets with icons.
- Inspector furniture mode: catalog id (read-only), rotation, scale,
  surface, color, duplicate, delete.
- Do not fold catalog into the primitive shape buttons — keep primitives
  and furniture visually separate.

## 5. Files to touch (expected)

- `libs/ui-kit/src/furniture/*` — catalog + icons (+ stories)
- `apps/editor/app/core/model/FurnitureObject.ts` + specs
- `apps/editor/app/core/model/SceneDocument.ts` — furniture map
- Persistence migrations + snapshot types
- `useEditorDocument` — catalog tool + APIs
- `EditorCatalogPanel.vue` / toolbar entry
- `EditorInspector.vue` — furniture mode
- SVG + Three renderers — furniture views/meshes

## 6. Tests

- Catalog presets resolve for all four ids
- Document add / move / material / remove / duplicate
- Snapshot round-trip with furniture
- Migration empty `furniture: []`
- Inspector enables furniture controls when selected

## 7. Definition of Done

- [x] All four presets placeable in 2D and 3D
- [x] Inspector edits transform/material; delete/duplicate work
- [x] Save / load keeps furniture
- [x] `schemaVersion` bumped with migration
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Marketplace, user mesh / glTF upload
- Parametric kitchens / cabinets
- Physics / collision between furniture pieces (basic overlap OK)
- Moving furniture between floors in one gesture (delete + place is fine)
