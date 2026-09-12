# Epic 07 — Rooms and floor / wall materials

Status: **implemented**  
Branch: `epic/07-rooms-materials`  
Depends on: Epic 06  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Detect **closed wall loops** and materialize `Room` entities with
   editable floor surface / color.
2. Render room floors in 2D (fill) and 3D (floor mesh).
3. Keep wall materials on `WallObject` (from Epic 06) editable in the
   inspector; recalculate rooms when walls change.

## 2. User stories

- As a user, after closing a wall loop I see a room with a floor I can
  recolor / retexture.
- As a user, I create two adjacent rooms with different floor materials.
- As a user, deleting a shared wall updates / removes rooms correctly.

## 3. Domain changes

```ts
interface Room {
  id: string;
  name: string;
  polygon: { x: number; z: number }[]; // CCW or CW — document winding
  floorSurface?: SurfaceKind;
  floorColor: string;
  wallIds: string[]; // walls forming the loop
}
```

### Contour detection

- Pure function module, e.g.
  `apps/editor/app/core/model/rooms/detectRooms(walls): RoomDraft[]`.
- Build a planar graph from wall endpoints (snap-merge epsilon), find
  minimal cycles / faces.
- Deterministic ordering (stable ids from sorted edge keys or hash of
  polygon).
- Re-run on wall add/remove/move; preserve materials when a room’s
  polygon fingerprint still matches.

### Scene defaults vs room floors

- Epic 04 `settings.floor` remains the **fallback** outside rooms or
  under open field.
- Room floor overrides inside its polygon.

### Snapshot

- Bump `schemaVersion`; store `rooms[]` (or recompute on load — prefer
  **store** user material overrides + revalidate polygons on load).

## 4. UI

- Rooms appear in a list or in the inspector when clicking the floor fill
  (2D) / floor mesh (3D).
- Inspector: room name, floor color, floor surface.
- Wall selection still edits wall surface (Epic 06).
- Optional badge: room count in status bar.

## 5. Files to touch (expected)

- `apps/editor/app/core/model/rooms/detectRooms.ts` + fixtures/specs
- `apps/editor/app/core/model/Room.ts` (or types-only)
- `apps/editor/app/core/model/SceneDocument.ts` — rooms collection /
  rebuild hook
- Persistence migrations + snapshot
- SVG: polygon fills under walls
- Three: floor meshes (Y = 0 or slight offset), materials via
  `TextureFactory`
- Inspector room mode

## 6. Tests (fixtures required)

| Fixture | Expected |
|---------|----------|
| Closed square | 1 room |
| Two adjacent rectangles sharing a wall | 2 rooms |
| Open U-shape | 0 rooms |
| Single diagonal wall | 0 rooms |

Also: deleting the shared wall of two rooms → rooms recalculated;
material preservation when polygon unchanged.

## 7. Definition of Done

- [x] Two adjacent rooms with different floors render in 2D and 3D
- [x] Wall delete recalculates rooms
- [x] Room materials survive save / load
- [x] Contour algorithm covered by fixture tests
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Openings cutting room area (Epic 08 may refine later)
- Ceiling editing (Epic 10 toggle only)
- Auto-naming beyond «Комната N»
- Furniture placement relative to rooms
