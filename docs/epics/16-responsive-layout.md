# Epic 16 — Responsive layout (mobile-first)

Status: **implemented**  
Branch: `epic/16-responsive-layout`  
Depends on: Epic 01 (shell), Epic 03 (inspector), Epic 04 (scene panel)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Make the **entire app shell and editor chrome** usable on phone and
   tablet viewports via **viewport-width** breakpoints (no UA sniffing).
2. Apply a **mobile-first** CSS strategy: base styles target narrow
   screens; `sm` / `md` / `lg` enhance density and restore the desktop
   three-column layout only at `lg` (≥1024px).
3. Keep domain / schema / renderers unchanged — layout and chrome only.

## 2. User stories

- As a user on a phone, I open the app and see a top bar with a menu;
  the permanent desktop sidebar does not steal half the screen.
- As a user on a phone/tablet, I edit a project with a full-width canvas;
  Scene and Inspector open as sheets when I need them.
- As a user on a desktop (`lg+`), I keep the familiar sidebar + dual
  panels layout.

## 3. Breakpoints (Tailwind defaults)

| Range | Width | Shell | Editor |
|-------|-------|-------|--------|
| base | &lt;640 | hamburger + drawer | canvas-first; Scene / Inspector sheets |
| sm–md | 640–1023 | same pattern, denser chrome | same sheets pattern |
| lg+ | ≥1024 | persistent `w-56` sidebar | dual `w-64` panels as today |

## 4. UI

### Shell

- Below `lg`: top bar (brand + menu button) opens an overlay drawer with
  Проекты / Редактор / Документация + theme switcher. Backdrop, Esc, and
  route change close the drawer. `aria-expanded` on the trigger;
  `data-testid="app-nav-menu"` / `app-nav-drawer`.
- At `lg:`: existing persistent `AppSidebar` (no mobile top bar).

### Editor

- Below `lg`: Scene and Inspector are not always-on columns. Triggers
  «Сцена» / «Инспектор» open full-width sheets with `overflow-y-auto`.
- At `lg:`: current row layout with both panels.
- Toolbar: smaller gaps / `size="sm"` by default; denser at `lg`.
- Inspector always gets `overflow-y-auto` (desktop clip fix too).
- Floor switcher: keep `flex-wrap`; reduce padding on narrow screens.

### Content pages

- Projects and docs: `p-4 sm:p-6 lg:p-8` (replace flat `p-8`).

## 5. Files to touch (expected)

- `docs/epics/16-responsive-layout.md` (this file)
- `docs/roadmap.md` — Phase 3 entry; remove mobile from out-of-scope
- `apps/editor/app/layouts/default.vue`
- `apps/editor/app/components/AppSidebar.vue` (+ specs)
- `apps/editor/app/components/AppShellHeader.vue` (new, if needed)
- `apps/editor/app/components/EditorWorkspace.vue`
- `apps/editor/app/components/EditorToolbar.vue`
- `apps/editor/app/components/EditorScenePanel.vue`
- `apps/editor/app/components/EditorInspector.vue`
- `apps/editor/app/pages/index.vue`, `pages/docs/**`
- `e2e/smoke.spec.ts` — mobile viewport smoke

## 6. Tests

- App shell: drawer opens/closes; nav links present.
- Workspace: sheet triggers exist; inspector scrollable class.
- Playwright: viewport 390×844 — `/` content visible without permanent
  sidebar; editor page mounts.

## 7. Definition of Done

- [x] Drawer nav below `lg`; persistent sidebar at `lg+`
- [x] Editor dual panels only at `lg+`; sheets below
- [x] Projects/docs padding mobile-first
- [x] Component + e2e smoke green; lint / typecheck / test / build green
- [x] Spec status marked **implemented** after merge

## 8. Out of scope

- PWA / native apps
- Full touch redesign of 3D walk mode
- Domain / schema changes
- Custom Tailwind screen tokens
- Storybook mobile redesign
