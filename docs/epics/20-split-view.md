# Epic 20 — Split 2D + 3D view

Status: **planned**  
Branch: `epic/20-split-view`  
Depends on: Epic 16 (responsive), Epic 17 (hardening)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

Sweet Home 3D’s signature UX is simultaneous plan + 3D. Today the editor
toggles one mode at a time. Ship a **«Рядом»** layout on desktop while
keeping the mobile single-canvas switch.

## 1. Goals

1. On `lg+`, offer a **split mode**: SVG plan left, three.js right, same
   `SceneDocument`.
2. Shared selection / drag / inspector across both panes.
3. Resizable splitter (persist ratio in `localStorage`).
4. Below `lg`, keep Epic 16/17 single-view 2D/3D toggle (no split).
5. Keep three.js off `/` and `/docs` critical paths (async canvas only).

## 2. User stories

- As a desktop user, I drag a chair on the plan and see it move in 3D
  without switching modes.
- As a desktop user, I resize the split so the plan is wider while drawing
  walls.
- As a phone user, I still get one canvas and sheets — no cramped dual
  panes.

## 3. Technical design

```ts
type EditorViewMode = '2d' | '3d' | 'split';
```

- Extend `mode` in `useEditorDocument` (or a sibling `viewLayout` ref) with
  `'split'`. Toolbar shows three options on `lg+`; on narrow viewports
  hide / coerce `'split'` → last non-split mode.
- [`EditorWorkspace.vue`](../../apps/editor/app/components/EditorWorkspace.vue):
  when split, mount both `EditorCanvas2D` and `EditorCanvas3D` in a
  horizontal flex with a drag handle.
- Both canvases already share provide/inject document context — no second
  document.
- ResizeObserver / pointer drag on splitter; clamp 25%–75%; store
  `sandbox:splitRatio`.
- Performance: pause three.js `requestAnimationFrame` when the 3D pane is
  hidden (leaving split); keep existing lazy import.

## 4. UI

- Toolbar: `2D` / `3D` / `Рядом` (`UiToggleGroup`) — third option only at
  `lg+` (or disabled with tooltip below).
- Splitter: `data-testid="editor-split-handle"`, keyboard optional (±).
- Floor switcher / sheets unchanged.

## 5. Files to touch (expected)

- `apps/editor/app/composables/useEditorDocument.ts` — mode type
- `apps/editor/app/components/EditorToolbar.vue`
- `apps/editor/app/components/EditorWorkspace.vue`
- Optional `EditorSplitPane.vue`
- `apps/editor/app/composables/useViewportLg.ts` — coerce split off-mobile
- Specs: mode options; workspace mounts both canvases in split
- e2e desktop: select «Рядом», both canvases visible

## 6. Tests

- Unit / component: entering split mounts 2D + 3D containers; leaving
  disposes or hides 3D without crashing.
- Selecting a shape in 2D updates inspector while split is active.
- Below `lg`, split option absent or forced off.
- Build still code-splits three.js.

## 7. Definition of Done

- [ ] Split mode on `lg+` with shared selection
- [ ] Resizable splitter; ratio persists
- [ ] Mobile keeps single-view behavior
- [ ] No three.js on `/` / `/docs`
- [ ] Lint / typecheck / test / e2e green

## 8. Out of scope

- Four-pane SH3D layout (catalog + list + plan + 3D)
- Vertical split / floating 3D picture-in-picture on mobile
- Elevation / section pane (swap candidate after this epic)
