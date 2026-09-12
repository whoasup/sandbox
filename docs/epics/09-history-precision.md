# Epic 09 — History and precision

Status: **planned**  
Branch: `epic/09-history-precision`  
Depends on: Epic 03 (strongly preferred after Epic 06 so wall/opening
commands are included)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Add a **command stack** over document mutations: undo / redo (~100
   entries).
2. Improve placement precision: measurements overlay, richer snap
   (grid from Epic 04, wall endpoints, 45°), nudge with arrow keys.
3. Support duplicate / copy-paste of the current selection (shapes and,
   when present, walls / openings).

## 2. User stories

- As a user, I undo a chain «add wall → add door → move shape» and redo
  it.
- As a user, I see lengths / sizes while editing and snap to grid /
  endpoints / 45°.
- As a user, I press Delete, Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z), and arrow
  keys to nudge.

## 3. Domain changes

### Command pattern

```ts
interface EditorCommand {
  readonly label: string;
  execute(): void;
  undo(): void;
}

class HistoryStack {
  push(cmd: EditorCommand): void;
  undo(): void;
  redo(): void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}
```

- Document mutations used by UI go through commands (or a single
  `DocumentTransaction` that snapshots before/after for complex ops).
- Prefer **explicit commands** for add/move/replaceKind/setSettings/
  addWall/updateOpening; avoid silent mutations from renderers.
- Limit stack size (~100); clear redo on new push.
- History is **session-only** (not persisted in IndexedDB) unless cheap
  — default: not persisted.

### Precision

- Snap pipeline: grid (`SceneSettings.field`) → wall endpoints → angle
  constraints (0/45/90…) while drawing walls / moving.
- Measurement overlay: selected wall length; selected shape footprint
  width/depth; optional live length while drawing a wall.
- Keyboard: Delete → remove selection; arrows → nudge by `gridStep`
  (Shift → larger step).

### Clipboard

- Internal clipboard for selected entity snapshot(s); paste offsets by
  grid step. System OS clipboard optional later.

## 4. UI

- Toolbar or menu: Undo / Redo buttons + shortcuts.
- Measurement labels in 2D (SVG text); optional 3D sprites / HTML overlay.
- Snap toggle may already exist from Epic 04 — extend behavior, don’t
  fork a second flag.

## 5. Files to touch (expected)

- `apps/editor/app/core/history/HistoryStack.ts` + command classes + specs
- Wire commands in `useEditorDocument` / document façade
- `apps/editor/app/core/snap/*` — snap helpers
- `apps/editor/app/components/EditorMeasurements.vue` (or renderer-owned
  labels)
- Keyboard composable `useEditorHotkeys.ts`
- Toolbar undo/redo controls

## 6. Tests

- History stack: push / undo / redo / overflow trim / redo cleared on
  new command — **no DOM**
- Command covering shape move + wall add
- Snap helpers: grid, endpoint, 45°
- Nudge / clipboard unit tests where logic is pure

## 7. Definition of Done

- [ ] Chain wall → opening → move undoes/redoes correctly
- [ ] Shortcuts work when editor is focused
- [ ] Measurements visible for selection / wall draw
- [ ] Snap respects grid + wall ends + 45° where applicable
- [ ] History unit tests without DOM
- [ ] Green lint / typecheck / test / build

## 8. Out of scope

- Persistent history across reloads
- Collaborative OT/CRDT history
- Full property-diff inspector timeline
- Multi-select marquee (single selection + clipboard of one entity is
  enough; multi-select only if already trivial)
