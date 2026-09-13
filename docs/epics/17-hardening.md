# Epic 17 — Hardening (responsive chrome + persistence)

Status: **implemented** (branch `epic/17-hardening`, pending merge)  
Branch: `epic/17-hardening`  
Depends on: Epic 16 (responsive), Epic 12 (stairs), Epic 05 (persistence), Epic 09 (history)  
Owners: `apps/editor` + `libs/editor-core`

Parent: [docs/roadmap.md](../roadmap.md)

Follow-up after Phases 1–3: fix gaps found in the post-merge audit (mobile
toolbar height, sheet a11y, IndexedDB migrations, stair undo, Pages
Storybook path, project/entity duplication, stale docs).

## 1. Goals

1. Make the editor **canvas-first** below `lg`: toolbar ≤ ~96px, no
   horizontal overflow at 390px.
2. Give Scene / Inspector sheets the same overlay hygiene as the nav
   drawer (Esc, body lock, one sheet, dialog semantics).
3. Run **schema migrations on IndexedDB read** (not only JSON import).
4. Keep **stair pairs** in sync across undo/redo.
5. Fix GitHub Pages Storybook `baseURL` and refresh stale docs.

## 2. User stories

- As a phone user, I see a short toolbar and a usable canvas.
- As a phone user, Esc / backdrop close the open sheet; only one sheet
  is open.
- As a returning user, old IndexedDB projects open after a schema bump.
- As a user, Ctrl+Z on a stair removes the paired marker on the other
  floor.
- As a user on GitHub Pages, `/docs/storybook` embeds the built kit.

## 3. Scope

### UI

- Compact [`EditorToolbar.vue`](../../apps/editor/app/components/EditorToolbar.vue)
  below `lg` (hide page title, two dense rows, `size="sm"`, `min-w-0`).
- Sheet Esc / body lock / mutual exclusion / `role="dialog"` in
  [`EditorWorkspace.vue`](../../apps/editor/app/components/EditorWorkspace.vue).
- Hide duplicate `h2` when inspector/scene sit inside a sheet.
- Export busy label stays short; click-outside closes the menu.
- Touch-sized hits (`min-h-11`) on toolbar toggles, export items, docs
  nav.

### Domain / persistence

- `hydrateStoredRecord` + re-save in `IndexedDbProjectStore` /
  `MemoryProjectStore` `get`/`list`.
- After history undo/redo, upsert or remove stair pairs.
- `cloneProjectFloors` — new floor ids + remapped stair `floorId` /
  `targetFloorId` / `linkId`.
- `SceneDocument.duplicateWall` / `duplicateOpening` + inspector
  buttons.

### Docs / chrome

- Roadmap §2 = shipped snapshot; editor README; `useHead` titles.
- Storybook iframe/HEAD uses `useRuntimeConfig().app.baseURL`.

## 4. Tests

- Unit: store hydrates + persists upgraded records; stair undo calls
  remove/upsert hooks; wall/opening duplicate; `duplicateProject` remaps
  floors.
- Component: inspector `overflow-y-auto`; export click-outside; toolbar
  still adds a cube.
- e2e 390×844: no document overflow; Esc closes inspector sheet;
  `/docs/storybook` iframe `src` contains the app base URL (or the
  missing-state testid is absent when static is built).

## 5. Definition of Done

- [x] Toolbar compact below `lg`; sheets match drawer overlay rules
- [x] IDB/memory `get`/`list` migrate and rewrite stale records
- [x] Stair undo/redo keeps pairs consistent
- [x] Pages Storybook path uses `baseURL`
- [x] Duplicate project / wall / opening behave as specified
- [x] Lint / typecheck / test / e2e green

## 6. Out of scope

- PWA / native apps
- Full 3D walk-mode touch redesign
- Chromatic / visual-regression SaaS
- New product features (catalog, extra export formats)
