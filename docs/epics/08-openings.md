# Epic 08 — Doors and windows

Status: **implemented**  
Branch: `epic/08-openings`  
Depends on: Epic 06 (can land in parallel with Epic 07)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Add **openings** (door / window) attached to walls with parametric
   placement along the segment.
2. Represent openings in 2D (gap / symbol) and 3D (framed hole or split
   wall spans — **no CSG required**).
3. Persist openings in snapshots with clamping so openings never extend
   past wall ends.

## 2. User stories

- As a user, I place a door and a window on the same wall and adjust
  width / height in the inspector.
- As a user, I move a wall and openings stay attached at the same
  relative `t`.
- As a user, I reload the project and openings remain valid.

## 3. Domain changes

```ts
type OpeningType = 'door' | 'window';

interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  /** Normalized position along wall centerline, 0..1 */
  t: number;
  width: number;
  height: number;
  /** Window sill height from floor; doors typically 0 */
  sill: number;
}
```

### Rules

- Opening belongs to exactly one wall; deleting the wall deletes its
  openings.
- Clamp `t` and `width` so the opening footprint stays inside the wall
  length (and thickness handled visually).
- Defaults: door taller/fuller; window shorter with sill > 0.
- Document API: `addOpening`, `moveOpening`, `updateOpening`,
  `removeOpening`.
- Tool: `opening-door` / `opening-window` or single Opening tool + type
  in inspector — pick one UX and document it in the PR.

### 3D strategy (locked)

Prefer **segmenting** the wall mesh into solid spans around the opening
(or a simple frame + transparent gap). Full CSG boolean is out of scope.

### Snapshot

- Bump `schemaVersion`; `openings[]` in snapshot; migrate empty array.

## 4. UI

- Toolbar: Door / Window tools (or Opening + type toggle).
- Placement: click a wall in 2D (primary); optional 3D pick on wall face.
- Inspector: type, width, height, sill (windows), `t` or offset readout.
- 2D symbols should be recognizable (door swing optional / minimal).

## 5. Files to touch (expected)

- `apps/editor/app/core/model/Opening.ts` + specs (clamp helpers)
- `apps/editor/app/core/model/SceneDocument.ts`
- Persistence migrations
- `useEditorDocument` tools
- Toolbar + inspector
- SVG wall view: gap + symbol
- Three wall builder: split spans / frame meshes

## 6. Tests

- Clamp width/`t` against wall length
- Wall delete cascades openings
- Snapshot round-trip with door + window on one wall
- Reject / clamp opening wider than wall

## 7. Definition of Done

- [x] Door and window coexist on one wall
- [x] Reload preserves openings
- [x] Opening cannot extend past wall ends
- [x] 2D and 3D both show openings without CSG
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Catalog of door/window styles / hardware
- Animated door swing / interaction
- Host walls that are curved
- Automatic opening in room-area subtraction (nice-to-have only)
