# Epic 12 — Stairs between floors

Status: **implemented**  
Branch: `epic/12-stairs`  
Depends on: Epic 10  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Add **stair** entities that link two floors in a multi-floor project.
2. Show stairs in 2D (symbol) and 3D (simple rectangular flight).
3. Jump to the linked floor when activating a stair in orbit / walk.
4. Persist stairs with a `schemaVersion` bump + migration.

## 2. User stories

- As a user with two floors, I place a stair on floor 1 linked to floor 2
  and see it in both plan and 3D.
- As a user, I click / activate the stair and the editor switches to the
  linked floor (same project, autosave current floor first).
- As a user, I adjust width / direction / step count and reload without
  losing the link.

## 3. Domain changes

```ts
interface StairObject {
  id: string;
  /** Floor that owns this stair instance (footprint lives here) */
  floorId: string;
  /** Target floor for navigation */
  targetFloorId: string;
  position: { x: number; z: number };
  rotationY: number;
  width: number;
  depth: number; // run length of the flight footprint
  stepCount: number;
  direction: 'up' | 'down'; // relative to owning floor
}
```

### Rules (locked)

- Stairs live in a **`stairs` collection** on the owning floor snapshot
  (not on `ShapeKind`).
- Creating a stair requires `targetFloorId !== floorId` and both floors
  exist on the project.
- Optional: place a **paired marker** on the target floor (same logical
  link id or mirrored stair with inverted `direction`). Prefer an
  explicit pair record or shared `linkId` so delete on one side cleans
  the other — document the chosen approach in the PR and test it.
- No CSG hole in the slab; visual opening is optional/simple.

### Pair approach (shipped)

Shared `linkId` on both ends. `upsertStairPair` writes a mirrored marker
(inverted `direction`) on the target floor; `removeStairPair` deletes
every stair with that `linkId` across floors.

### Document / project API

- `addStair`, `updateStair`, `removeStair`
- `activateStair(id)` → persist active floor, switch `activeFloorId`,
  load target floor document
- Snapshot migration: `stairs: []` per floor

### 3D / 2D

- 2D: plan symbol (arrow / stair hatch) with link affordance
- 3D: stacked box steps or a single ramp mesh; pickable

## 4. UI

- Tool «Лестница» after Select / Wall / Opening tools.
- Placement: click on plan; inspector sets target floor (dropdown of
  other floors), width, depth, stepCount, direction.
- Floor switcher (Epic 10) remains source of truth; stair activation is a
  shortcut into it.

## 5. Files to touch (expected)

- `apps/editor/app/core/model/StairObject.ts` + specs
- `SceneDocument` / floor snapshot types — `stairs` map
- Project load/save + migrations
- `useEditorDocument` / project floor switcher integration
- Toolbar tool + inspector stair mode
- SVG + Three stair views
- Hotkey / click handler for activate

## 6. Tests

- Reject stair with invalid / same-floor target
- Pair cleanup on delete (if pairs are used)
- Snapshot round-trip
- `activateStair` switches active floor id (unit with fake project store)
- Migration adds empty `stairs`

## 7. Definition of Done

- [x] Stair links two floors and is visible in 2D and 3D
- [x] Activating stair switches floor without data loss
- [x] Save / load preserves stairs
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Elevators
- Spiral / L-shaped stairs
- Full slab CSG / structural openings
- Automatic building-code validation
