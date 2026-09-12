# Epic 01 — App shell, routing, sidebar

Status: **planned**  
Branch: `epic/01-app-shell`  
Depends on: —  
Owners: `apps/editor` (+ `libs/ui-kit` only if a nav primitive is required)

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Introduce a Nuxt **default layout** with sidebar navigation so the app
   is no longer a single full-screen editor page.
2. Split routes into **Projects**, **Editor**, and **Documentation**
   stubs so later epics have a place to land.
3. Move the live editor off `/` onto `/editor/:projectId` without losing
   current 2D/3D behavior.

## 2. User stories

- As a user, I can open **Проекты**, **Редактор**, and **Документация**
  from a persistent sidebar and see which section is active.
- As a user, I can open the editor at `/editor/:projectId` and use the
  same toolbar + canvas behavior as today.
- As a user, I can switch light / dark / system theme from the shell
  (not only from the editor toolbar).

## 3. Domain / routing model

No domain model changes. Context rules:

- `createThemeContext()` stays in [`app/app.vue`](../../apps/editor/app/app.vue).
- `createEditorDocumentContext()` moves with the editor page — **only**
  on `app/pages/editor/[projectId].vue`. Layouts must not create the
  document.
- Until Epic 05, `:projectId` may be a hardcoded stub id (e.g. `draft`)
  linked from the projects list.

### Target routes

| Path | Page | Notes |
|------|------|-------|
| `/` | Project library stub | Empty state or one “Черновик” card linking to editor |
| `/editor/:projectId` | Current editor UI | Toolbar + 2D/3D canvases |
| `/docs` | Docs hub stub | Placeholder copy until Epic 02 |

## 4. UI

- New `app/layouts/default.vue`: left sidebar + main content (`<NuxtPage />`).
- Sidebar items (Russian labels): Проекты → `/`, Редактор → last/draft
  editor route, Документация → `/docs`.
- Active link styling via Vue Router / NuxtLink.
- Relocate `UiThemeSwitcher` into the shell (sidebar footer or header).
  Editor toolbar may keep a compact duplicate or drop it — prefer **one**
  switcher in the shell to avoid clutter.
- Editor page keeps its own full-height canvas region inside the layout
  content area (toolbar + main), not as a second full-viewport shell.

Prefer existing `UiButton` / `UiText` for nav. Add `UiNav` / nav-item in
ui-kit **only** if app-level markup becomes unmaintainable.

## 5. Files to touch (expected)

- `apps/editor/app/layouts/default.vue` (new)
- `apps/editor/app/pages/index.vue` — rewrite as project list stub
- `apps/editor/app/pages/editor/[projectId].vue` (new) — move current
  editor from old `index.vue`
- `apps/editor/app/pages/docs/index.vue` (new) — stub
- `apps/editor/app/components/AppSidebar.vue` (new, optional)
- `apps/editor/app/app.vue` — ensure layout + theme still wire correctly
- `apps/editor/README.md` — document new routes
- Tests: update paths that assumed editor at `/`; add shallow layout /
  nav tests if useful

## 6. Tests

- Editor document context still mounts on the editor route (existing
  composable / toolbar specs adapted).
- Smoke: navigating between stub pages does not throw (component or
  Nuxt page test if already patterned; otherwise manual checklist in PR).

## 7. Definition of Done

- [ ] All three sections open from the sidebar; active item is highlighted
- [ ] Theme switcher works from the shell with no FOWT regression
- [ ] Editor works at `/editor/:projectId` with existing add / select /
      drag / delete / 2D–3D toggle
- [ ] `pnpm lint`, `typecheck`, `test`, `build` green

## 8. Out of scope

- Real IndexedDB project CRUD (Epic 05)
- Full kit documentation content (Epic 02)
- Object inspector / scene settings panels (Epics 03–04)
- Walls / rooms (Epics 06+)
