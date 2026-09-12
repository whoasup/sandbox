# Epic 06 — Walls

Status: **implemented**  
Branch: `epic/06-walls`  
Depends on: Epic 05  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Add **wall segments** as first-class editor entities (not
   `ShapeKind` primitives).
2. Provide a 2D **Wall** drawing tool (click–click or drag) with snap to
   grid and wall endpoints; show extruded walls in 3D with pick / move.
3. Persist walls in the project snapshot (`schemaVersion` bump +
   migration).

## 2. User stories

- As a user, I draw four walls in 2D and see a room box in 3D.
- As a user, I select a wall, move it, change height / thickness /
  surface, and delete it.
- As a user, I save and reload a project with walls intact.

## 3. Domain changes

### Entity model (locked for this epic)

Use **two collections** on the document — do **not** introduce a single
polymorphic `Entity` union for shapes and walls:

```ts
// SceneDocument
shapes: Map<string, SceneObject>
walls: Map<string, WallObject>
```

Selection cursor becomes able to point at either a shape or a wall
(`selected: { type: 'shape' | 'wall'; id: string } | null`) — or two
parallel selection fields; pick one API and stick to it.

### `WallObject`

```ts
interface WallObject {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number;
  thickness: number;
  surface: SurfaceKind;
  color?: string;
}
```

Methods: move endpoints / translate segment, setters for height,
thickness, surface. Footprint helpers for snap and 2D hit-testing.

### Document API

- `addWall(init)`, `removeWall(id)`, `moveWall(id, …)`,
  `setWallSurface`, etc.
- Snapshot: `{ objects, walls, settings, schemaVersion }` (migration
  from v1 → v2 adds `walls: []`).

### Tools

Active tool enum on the Vue bridge: `select` | `wall` (extend later for
openings). Wall tool only draws in 2D; 3D remains select/orbit unless
trivial.

## 4. UI

- Toolbar: tool toggle Select / Wall; wall height/thickness defaults.
- 2D: rubber-band preview while drawing; snap indicators at grid and
  existing endpoints.
- 3D: box/extruded mesh along segment; selection highlight; drag
  translates the whole segment on the floor plane (endpoint editing can
  be 2D-first).
- Inspector (Epic 03): when a wall is selected, show wall fields instead
  of shape kind replace.

## 5. Files to touch (expected)

- `apps/editor/app/core/model/WallObject.ts` (new) + specs
- `apps/editor/app/core/model/SceneDocument.ts` — walls collection
- `apps/editor/app/core/persistence/migrations.ts` — bump schema
- `apps/editor/app/composables/useEditorDocument.ts` — tool + wall APIs
- `apps/editor/app/components/EditorToolbar.vue` — tool switch
- `apps/editor/app/components/EditorInspector.vue` — wall mode
- `apps/editor/app/core/render/svg/*` — wall views + draw interaction
- `apps/editor/app/core/render/three/*` — wall meshes
- Snapshot serialize / ProjectStore consumers

## 6. Tests

- Wall create / move / remove on document
- Snapshot round-trip with walls
- Migration v1 → v2
- 2D hit-test / length helpers
- Optional: snap-to-endpoint unit tests

## 7. Definition of Done

- [x] Draw a closed four-wall box in 2D; walls visible in 3D
- [x] Select / move / delete wall; surface editable
- [x] Save / load via IndexedDB keeps walls
- [x] `schemaVersion` bumped with migration
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Automatic room detection (Epic 07)
- Doors / windows (Epic 08)
- Multi-floor (Epic 10)
- CSG boolean wall joins / mitered corners (simple abutting segments OK)
- Furniture catalog
