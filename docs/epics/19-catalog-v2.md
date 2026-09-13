# Epic 19 — Furniture catalog v2

Status: **implemented**  
Branch: `epic/19-catalog-v2`  
Depends on: Epic 11 (catalog), Epic 17 (hardening)  
Owners: `apps/editor` + `libs/ui-kit` (+ `libs/editor-core` for size fields)

Parent: [docs/roadmap.md](../roadmap.md)

Grow the built-in catalog toward Sweet Home 3D / RoomSketcher UX
(categories, search, more presets, exact footprint) **without** a
marketplace or user mesh upload.

## 1. Goals

1. Expand presets from 4 to **12–20** procedural items (still three.js
   primitives / simple compounds).
2. Add **categories** + **search** in the catalog panel.
3. Inspector: edit exact **W × D × H (м)** instead of only uniform `scale`.
4. Add an **objects list** for the active floor (click → select), similar
   to SH3D’s furniture list.

## 2. User stories

- As a user, I filter «Кухня» and place a sink / stove without scrolling
  through living-room items.
- As a user, I search «диван» and place it at 2.1 × 0.9 × 0.8 м.
- As a user, I open the objects list, click «Стол», and the plan selects it.

## 3. Domain / catalog changes

```ts
type FurnitureCategory =
  | 'living'
  | 'bedroom'
  | 'kitchen'
  | 'bath'
  | 'lighting'
  | 'decor';

interface FurniturePreset {
  id: FurnitureCatalogId;
  label: string;
  category: FurnitureCategory;
  footprint: { width: number; depth: number };
  height: number;
  // …
}
```

- New catalog ids (examples): sofa, nightstand, dining-table, stove, sink,
  toilet, bathtub, floor-lamp, plant, rug, tv, shelf — keep existing
  chair / table / bed / wardrobe.
- `FurnitureObject`: store `width` / `depth` / `height` (or derive from
  preset × non-uniform scale). Prefer explicit size fields so inspector
  edits are stable across preset swaps.
- Snapshot: bump only if shape changes (`schemaVersion` 8 if not already
  taken by Epic 18, or 9 if 18 lands first — coordinate in PR). Prefer
  landing after 18 and using **v9** if dimensions already claimed v8.
- Migration: missing size fields ← preset defaults × old `scale`.

## 4. UI

- [`EditorCatalogPanel.vue`](../../apps/editor/app/components/EditorCatalogPanel.vue):
  category chips / select + search input; grid of presets with icons.
- Inspector: three number inputs (W/D/H) for furniture; keep rotation.
- New `EditorObjectsList.vue` (or section in Scene / Inspector sheet):
  shapes + furniture + walls summary; click selects.
- ui-kit: extend `FURNITURE_CATALOG`, icons (`UiFurnitureIcon` variants),
  Storybook / docs demos.

## 5. Files to touch (expected)

- `libs/ui-kit/src/furniture/**`
- `libs/editor-core/src/model/FurnitureObject.ts` + `SceneDocument`
- `apps/editor/app/components/EditorCatalogPanel.vue`
- `apps/editor/app/components/EditorInspector.vue`
- `apps/editor/app/components/EditorObjectsList.vue` (new)
- `apps/editor/app/core/render/three/ThreeFurnitureMesh.ts` + SVG view
- Specs + Storybook stories for new icons

## 6. Tests

- Catalog filter / search unit helpers.
- Furniture size round-trip in snapshot; migration from scale-only.
- Objects list click selects the entity (component test).
- Mesh factory still builds each new catalog id.

## 7. Definition of Done

- [x] ≥12 presets across ≥4 categories with search
- [x] Exact W×D×H in inspector; persist + undo
- [x] Objects list selects entities
- [x] No marketplace / upload paths introduced
- [x] Lint / typecheck / test / build green

## 8. Out of scope

- Marketplace, user mesh upload, brand catalogs
- Parametric kitchens / cabinets CSG
- Photoreal materials beyond wood/fabric/stone
