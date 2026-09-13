# Epic 21 — Room gesture + project templates

Status: **implemented**  
Branch: `epic/21-room-templates`  
Depends on: Epic 07 (rooms / walls), Epic 17 (hardening)  
Owners: `apps/editor` + `libs/editor-core`

Parent: [docs/roadmap.md](../roadmap.md)

Match Planner 5D / RoomSketcher “room-first” entry: place a room by
rectangle (and simple L), enter exact sizes, and start from a few baked
project templates — still fully editable walls afterward.

## 1. Goals

1. Toolbar tool **«Комната»**: drag a rectangle (and a simple L-shape
   gesture or second click) that creates the enclosing walls and lets
   `detectRooms` produce a room.
2. Dialog / sheet **«Новая комната»**: width × depth × default wall height;
   presets 3×4, 4×5, студия.
3. On `/`, **3–4 starter templates** (студия, 1к, офис, …) as JSON fixtures
   in the repo — import into IndexedDB like Epic 05 import (no backend).

## 2. User stories

- As a user, I choose «Комната», drag 4×5 м, and get four walls + a named
  room without tracing each segment.
- As a user, I open «Новая комната», type 3.2 × 4.1, and place it at a
  click point.
- As a user on the projects page, I click «Студия» and land in the editor
  with a ready layout.

## 3. Domain changes

```ts
function addRectangularRoom(
  doc: SceneDocument,
  opts: { origin: Point2; width: number; depth: number; wallHeight?: number; name?: string },
): { wallIds: string[]; roomId: string | null };
```

- Implement via existing `addWall` + room rebuild; do **not** invent a
  parallel room-only geometry.
- Optional L-shape: two rectangles merged into six outer walls (document
  the wall-merge / shared-edge rules in the PR).
- Wall draw tool remains; room tool is additive.
- Templates: static JSON under e.g.
  `apps/editor/public/templates/*.json` or
  `apps/editor/app/constants/projectTemplates.ts` (serialized
  `ProjectRecord` / floor snapshots). Creating from template calls
  `createProjectRecord` + `save` with remapped ids (reuse
  `cloneProjectFloors` patterns).

No schema bump required unless templates store new fields (they should
not).

## 4. UI

- Toolbar tool option «Комната» (2D-only auto-switch).
- Modal / sheet: dimensions + name + place / cancel.
- Projects page: «Создать из шаблона» cards next to empty state / create
  button.
- Live rubber-band preview while dragging the rectangle (SVG overlay).

## 5. Files to touch (expected)

- `libs/editor-core/src/model/` — room builder helper + specs
- `apps/editor/app/composables/useEditorDocument.ts` — `addRoomRect` etc.
- `apps/editor/app/core/render/svg/SvgRenderer.ts` — draft preview
- `apps/editor/app/components/EditorToolbar.vue`
- `apps/editor/app/components/EditorRoomDialog.vue` (new)
- `apps/editor/app/pages/index.vue` + template fixtures
- e2e: create from template → editor mounts with walls

## 6. Tests

- Unit: rectangle yields 4 walls + 1 room; L yields expected wall count;
  dimensions match inputs within epsilon.
- Undo removes the whole room gesture as one history entry (or documented
  multi-step — prefer one snapshot command).
- Template create remaps ids and does not collide with existing projects.

## 7. Definition of Done

- [x] Room tool + size dialog place editable walls/rooms
- [x] ≥3 project templates creatable from `/`
- [x] Walls remain fully editable after placement
- [x] Lint / typecheck / test / e2e green

## 8. Out of scope

- AI floor-plan recognition / photo → walls
- Freeform polygon room tool (beyond rect + simple L)
- Marketplace template gallery
- Auto-furnish room (can reuse catalog later)
