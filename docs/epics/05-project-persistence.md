# Epic 05 — Projects in IndexedDB

Status: **implemented** — branch `epic/05-project-persistence`  
Branch: `epic/05-project-persistence`  
Depends on: Epic 01 (prefer merge of Epics 03 + 04 first so snapshots
include inspector fields and `SceneSettings`)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Persist projects in **IndexedDB** behind a `ProjectStore` interface
   (in-memory fake for tests).
2. Wire `/` to real project CRUD (create, rename, duplicate, delete) and
   `/editor/:projectId` to load / autosave.
3. Support **JSON export / import** of a single project file (no cloud).

## 2. User stories

- As a user, I create several projects on `/`, open one, refresh the
  browser, and find the scene intact.
- As a user, I rename, duplicate, or delete projects from the library.
- As a user, I download a project JSON and import it into a new project.

## 3. Domain / storage model

```ts
interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number; // epoch ms
  schemaVersion: number;
  snapshot: SceneSnapshot;
}

interface SceneSnapshot {
  objects: SceneObjectSnapshot[];
  settings: SceneSettings; // from Epic 04; defaults if older stub
}

interface ProjectStore {
  list(): Promise<ProjectRecord[]>;
  get(id: string): Promise<ProjectRecord | null>;
  save(record: ProjectRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- Implementation: IndexedDB (idb / native wrapper — pick one lightweight
  dependency or a small hand-rolled store). Prefer **no** backend.
- `schemaVersion`: start at `1`. Migrations in
  `apps/editor/app/core/persistence/migrations.ts` (bump when Epics 06+
  add walls / rooms / floors).
- Autosave: debounce (e.g. 300–500 ms) on document `change`; update
  `updatedAt`.
- Missing `projectId`: show not-found UI or redirect to `/` (pick one;
  document in UI copy).
- Prefs (theme) remain in `localStorage` — do not mix into IDB.

### Export / import

- Export: serialize `ProjectRecord` (or `{ name, schemaVersion, snapshot }`)
  as downloadable `.json`.
- Import: validate shape + `schemaVersion`, run migrations, `save` new id.

## 4. UI

- `/` project cards: name, relative updated time, Open / Rename /
  Duplicate / Delete / Export.
- Empty state CTA: «Создать проект».
- Editor: subtle dirty/saving indicator optional; must not block canvas.
- Import control on the library page (file input).

## 5. Files to touch (expected)

- `apps/editor/app/core/persistence/ProjectStore.ts` (interface)
- `apps/editor/app/core/persistence/IndexedDbProjectStore.ts`
- `apps/editor/app/core/persistence/MemoryProjectStore.ts` (tests)
- `apps/editor/app/core/persistence/migrations.ts`
- `apps/editor/app/core/persistence/serialize.ts` / snapshot helpers
- `apps/editor/app/composables/useProjects.ts` (or similar)
- `apps/editor/app/pages/index.vue` — real library
- `apps/editor/app/pages/editor/[projectId].vue` — load + autosave
- `apps/editor/app/core/model/SceneDocument.ts` — `toSnapshot` /
  `fromSnapshot` (or factory)
- Specs for store + migrations + serialize round-trip

## 6. Tests

- Memory store CRUD
- Snapshot round-trip (objects + settings)
- Migration no-op for current version; stub for future bump
- Do **not** require a real browser IndexedDB in unit tests (fake /
  memory)

## 7. Definition of Done

- [x] F5 does not lose the open project’s scene
- [x] Library shows multiple projects with rename / duplicate / delete
- [x] Export / import JSON works for a single project
- [x] Unknown id handled without crashing the shell
- [x] Store covered by tests without real IDB
- [x] Green lint / typecheck / test / build

## 8. Out of scope

- Accounts, sync, multi-device
- Backend API
- Autosave conflict resolution / multi-tab locking (nice-to-have only)
- Floors array in snapshot (Epic 10) — keep a flat snapshot until then;
  leave `schemaVersion` room to grow
