# Epic 10 — Camera modes and floors

Status: **planned**  
Branch: `epic/10-camera-floors`  
Depends on: Epic 07  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Expand 3D camera beyond orbit: **top lock** and **walk** (WASD) with
   simple wall collision / floor clamp.
2. Introduce **multi-floor** projects: each floor has its own document
   slice (shapes, walls, rooms, openings, settings as needed).
3. Show the floor below as a translucent reference in 3D; optional
   ceiling toggle (not a full ceiling editor).

## 2. User stories

- As a user, I switch camera presets (orbit / top / walk) from the
  toolbar.
- As a user, I add a second floor, edit its rooms, and switch between
  floors without losing data.
- As a user, in walk mode I cannot fall through the floor or walk through
  walls (basic collision).

## 3. Domain changes

### Project shape (schema bump)

```ts
interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  schemaVersion: number; // bump from previous
  floors: FloorRecord[];
  activeFloorId?: string; // optional UI preference; may live only in session
}

interface FloorRecord {
  id: string;
  name: string;
  elevation: number; // meters relative to ground
  snapshot: SceneSnapshot; // objects, walls, rooms, openings, settings
}
```

- Migration: wrap existing flat snapshot into `floors: [{ id, name:
  'Этаж 1', elevation: 0, snapshot }]`.
- Editor loads **one active floor** into `SceneDocument`; switching floors
  autosaves current floor then loads the next.
- Ceiling: boolean `showCeiling` on floor or settings — simple plane;
  no slab editing tools.

### Camera

```ts
type CameraMode = 'orbit' | 'top' | 'walk';
```

- `orbit`: current Three controls.
- `top`: orthographic or locked perspective looking down (−Y), pan/zoom.
- `walk`: first-person / eye-height camera; WASD + mouse look; collide
  with wall segments in XZ; keep feet on `elevation`.

Store mode in session (and optionally in project prefs) — not required
in IndexedDB.

## 4. UI

- Toolbar: camera mode toggle (reuse `UiToggleGroup`).
- Floor switcher: tabs or select (Этаж 1 / Этаж 2 / +).
- Ceiling visibility toggle.
- Walk mode: short hint overlay for controls; Escape returns to orbit.

## 5. Files to touch (expected)

- Persistence model + migrations for `floors[]`
- `useProjects` / editor page — active floor load/save
- `apps/editor/app/core/render/three/camera/*` — mode controllers
- Collision helpers from wall segments
- Toolbar camera + floor UI
- Translucent previous-floor renderer pass (read-only meshes)
- Specs: migration flat → floors; floor switch round-trip

## 6. Tests

- Migration produces one floor from legacy snapshot
- Saving floor A then editing floor B does not clobber A
- Collision: point inside wall AABB / segment inflate rejected
- Camera mode state machine (unit) if non-trivial

## 7. Definition of Done

- [ ] Two floors with different rooms persist and switch correctly
- [ ] Walk mode stays on floor and is blocked by walls (basic)
- [ ] Orbit and top modes remain usable for editing
- [ ] Snapshot schema includes `floors`; migration from prior version
- [ ] Green lint / typecheck / test / build

## 8. Out of scope

- Stairs / elevators as modeled objects (placeholder gap OK)
- Full ceiling/roof editor
- Photoreal outdoor environment
- Mobile walk controls
- Real-time multiplayer presence per floor
