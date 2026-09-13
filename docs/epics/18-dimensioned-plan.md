# Epic 18 — Dimensioned 2D plan

Status: **planned**  
Branch: `epic/18-dimensioned-plan`  
Depends on: Epic 07 (rooms), Epic 09 (measurements / history), Epic 17 (hardening)  
Owners: `apps/editor` + `libs/editor-core`

Parent: [docs/roadmap.md](../roadmap.md)

Close the largest gap vs Sweet Home 3D / RoomSketcher / Space Designer:
persistent lengths, room areas, and user dimension lines on the 2D plan
(not only the selection pill from Epic 09).

## 1. Goals

1. Show **wall lengths** on the SVG plan at all times (toggleable).
2. Show each **room name + area (m²)** centered in the polygon.
3. Add a **«Размер»** tool that places a user `DimensionLine` between two
   points (with undo/redo).
4. Optional **compass / north** rose on the plan corner.
5. Bump `schemaVersion` to **8** and migrate empty `dimensions: []`.

## 2. User stories

- As a user, I see wall lengths while drawing and after walls exist, without
  selecting each wall.
- As a user, I see «Кухня · 12.4 м²» inside a closed room.
- As a user, I place a dimension between two corners and it persists across
  reload / undo.
- As a user, I can hide auto wall labels if the plan is cluttered.

## 3. Domain changes

```ts
interface DimensionLineSnapshot {
  id: string;
  start: Point2;
  end: Point2;
  /** Optional offset perpendicular to the segment for the label. */
  offset?: number;
}

// SceneSnapshot (+ schema v8)
dimensions: DimensionLineSnapshot[];
```

- `SceneDocument`: `addDimension` / `updateDimension` / `removeDimension` /
  `listDimensions`; include in `toSnapshot` / `fromSnapshot`.
- Room area: use existing polygon (shoelace); expose `room.areaM2` helper
  or compute in the SVG view.
- History: dimension add/move/delete go through the existing snapshot
  command path.
- Migration v7→v8: ensure `dimensions: []` on every floor snapshot.

## 4. UI

- Toolbar tool **Размер** (2D only; auto-switch to 2D like wall/door).
- Scene panel (or plan overlay toggles): «Длины стен», «Площади», «Компас».
- SVG: wall mid-point length labels; room name + area; dimension lines with
  end ticks + length text.
- Selection pill in `EditorMeasurements` remains for live wall draft length.

## 5. Files to touch (expected)

- `docs/epics/18-dimensioned-plan.md` (this file)
- `libs/editor-core/src/model/` — `DimensionLine`, `SceneDocument`, types
- `libs/editor-core/src/persistence/migrations.ts` — v8
- `apps/editor/app/core/render/svg/Svg2DWallView.ts`
- `apps/editor/app/core/render/svg/Svg2DRoomView.ts`
- `apps/editor/app/core/render/svg/Svg2DDimensionView.ts` (new)
- `apps/editor/app/components/EditorToolbar.vue` — tool option
- `apps/editor/app/composables/useEditorDocument.ts`
- Specs for area helper + dimension CRUD + migration

## 6. Tests

- Unit: shoelace area for rectangle / L-shape; dimension CRUD + snapshot
  round-trip; migrate v7 → v8 adds `dimensions: []`.
- Component / renderer: SVG contains length text for a known wall; room
  label includes м².
- Undo removes a placed dimension.

## 7. Definition of Done

- [ ] Auto wall lengths and room areas visible on 2D plan
- [ ] User dimension tool + persistence + undo
- [ ] Optional compass; toggle for auto labels
- [ ] schemaVersion 8 + migrate-on-read green
- [ ] Lint / typecheck / test / build green

## 8. Out of scope

- Elevation / section dimensions (Phase 4 swap candidate)
- PDF print packs
- CAD / DXF export
- Editing room polygons by dragging area labels
