# sandbox

Hard skills practicing sandbox.

Nx monorepo (pnpm workspaces) with three projects:

```
apps/editor        @sandbox/editor        — Nuxt 4 2D/3D room editor (planner5d-style)
libs/editor-core   @sandbox/editor-core   — framework-agnostic scene domain + persistence
libs/ui-kit        @sandbox/ui-kit        — Vue 3 design system, Storybook
```

## `apps/editor`

A minimal planner5d-style room editor: place primitives on a floor, switch
between a 3D perspective view and a 2D top-down floor plan, and edit each
shape's surface finish and color. Both views read/write the same document,
so switching modes never loses state.

- **Mode toggle** — 2D (SVG) / 3D (three.js), driven by a shared `SceneDocument`.
- **Shapes** — cube, sphere, cylinder, pyramid, added via a `ShapeFactory`
  and modeled as an OOP class hierarchy (`SceneObject` → `CubeObject` /
  `SphereObject` / `CylinderObject` / `PyramidObject`).
- **Surfaces** — three procedural textures (wood / fabric / stone), drawn
  once in `libs/ui-kit`'s `drawTexturePattern` and reused, unmodified, by
  the 3D `CanvasTexture` material, the 2D SVG `<pattern>` fill, and the
  toolbar's `UiTextureSwatch` preview.
- **Interaction** — click a shape in either view to select it (blue
  outline), drag it to move it, delete it, or repaint its surface/color.
- **Export** — toolbar **Экспорт** menu: PNG (annotated 2D plan rasterized
  from SVG), SVG (2D plan with legend / dimensions), glTF/GLB (active-floor
  meshes), 360° equirect from walk / offscreen capture, plus Epic 05 project
  JSON. Filenames: `{project}-{floor}.{ext}` (360: `{project}-{floor}-360.png`).
  Scene panel **Чертёж / Чистовик** toggles draught furniture outlines for
  live 2D and plan export.
- Architecture: domain in `libs/editor-core` (`SceneDocument`, walls,
  rooms, openings, furniture, stairs, persistence, history), renderers in
  `app/core/render/{svg,three}` (`ISceneRenderer`), export in
  `app/core/export` (PNG plan / SVG / glTF / 360; three paths lazy-loaded), Vue bridge
  in `app/composables/useEditorDocument.ts`, UI in `app/components`.
  Three.js loads via dynamic import of `EditorCanvas3D` / `ThreeRenderer`.

See [`apps/editor/README.md`](apps/editor/README.md) for scripts and structure.

## `libs/editor-core`

Framework-agnostic editor domain: `SceneDocument`, shapes, walls, rooms,
openings, furniture, stairs, scene settings, snapshots/migrations,
history helpers, and snap — unit-testable without Nuxt or Vue. Consumed by
the editor as `@sandbox/editor-core` (workspace `@sandbox/source` condition
for HMR in dev).

## `libs/ui-kit`

Framework building blocks shared by the editor (and any future app):
`UiButton`, `UiText`, `UiToggleGroup`, `UiShapeIcon`, `UiTextureSwatch`,
`UiThemeSwitcher`, two-layer design tokens (Tailwind `@theme` + a typed
mirror), and small dependency-free helpers/utils (`EventEmitter`,
`classNames`, `createId`, `clamp`, color helpers). Documented and tested in
Storybook + Vitest.

See [`libs/ui-kit/README.md`](libs/ui-kit/README.md) for scripts and structure.

## Styling & theming

Both projects are styled with **Tailwind CSS v4** (`@tailwindcss/vite`,
CSS-first config — no `tailwind.config.js`). The two-layer token model is
unchanged, just re-hosted:

- **Primitives** (`libs/ui-kit/src/styles/theme.css`) — an orange accent
  scale plus grays/feedback colors, radii, and typography, defined in an
  `@theme` block Tailwind reads to generate utilities (`bg-orange-500`,
  `rounded-lg`, `font-sans`, …).
- **Semantic aliases** (`libs/ui-kit/src/styles/tokens.css`) — `--ui-color-*`
  variables that flip per `[data-theme='light'|'dark']`, bridged into
  Tailwind's utility namespace via `@theme inline` so `bg-primary`,
  `text-text-muted`, etc. resolve live when the theme changes, no rebuild
  needed. Components only ever consume this layer, never the primitives.
- **Theme switcher** — `useTheme()`/`createThemeContext()` (provided once
  from `app.vue`) plus `UiThemeSwitcher` support three states: `light`,
  `dark`, `system`. The preference persists to `localStorage` and an inline
  boot script (`apps/editor/nuxt.config.ts`) resolves it before hydration
  to avoid a flash of the wrong theme.
- Each package (`libs/ui-kit`, `apps/editor`) runs its **own** Tailwind
  compilation, explicitly scoped to its own sources via `source(...)`, and
  imports the same `theme.css`/`tokens.css` partials so both stay visually
  identical. See
  [`docs/tailwind-migration-plan.md`](docs/tailwind-migration-plan.md) for
  the full rationale.

## Tooling

- **Runtime**: Node 22 (pinned via `.nvmrc` and `engines`).
- **Language**: TypeScript everywhere, OOP for the editor's domain/render
  layer (abstract base classes, factories, encapsulated renderer classes).
- **Bundler**: Vite (both the ui-kit library build and, under the hood,
  Nuxt's dev/build pipeline).
- **Linting**: ESLint (flat config, `@nx/eslint-plugin` + `eslint-plugin-vue`
  + `eslint-plugin-storybook` for `*.stories.ts`) and Stylelint
  (`stylelint-config-standard` + `stylelint-config-tailwindcss` + Vue SFC
  `<style>` support).
- **Formatting**: Prettier, run as an ESLint rule (`eslint-plugin-prettier`)
  for `.ts`/`.js`/`.vue`, and directly for plain `.css`. `pnpm lint --fix`
  fixes both lint issues and formatting in one pass.
- **Pre-commit**: Husky + lint-staged run ESLint/Stylelint/Prettier `--fix`
  on staged files only, blocking the commit if anything is left unfixed.
- **Testing**: Vitest + `@vue/test-utils` for unit/component tests,
  Storybook for interactive component documentation.
- **Monorepo**: Nx 23 (pnpm workspaces), with project-level `build`, `test`,
  `lint`, `typecheck` targets inferred from each project's own config.

## Scripts

```bash
pnpm install

pnpm dev         # nx run editor:serve   — http://localhost:4300
pnpm storybook   # nx run ui-kit:storybook — http://localhost:4400
pnpm build:storybook  # static Storybook → apps/editor/public/docs-storybook
pnpm build:pages      # SPA for GitHub Pages → apps/editor/.output/public
                      # (set DEPLOY_TARGET; run build:storybook first for /docs/storybook)

pnpm build       # nx run-many -t build
pnpm test        # nx run-many -t test
pnpm lint        # nx run-many -t lint
pnpm lint:style  # stylelint "**/*.{css,vue}"
pnpm format      # eslint --fix (incl. Prettier) + stylelint --fix + prettier --write, repo-wide
pnpm typecheck   # nx run-many -t typecheck
pnpm e2e         # Playwright smoke against nuxt preview (after pnpm build)
```

## GitHub Pages

Production URL: **https://whoasup.github.io/sandbox/**

- Workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml) — on push to
  `main` (and `workflow_dispatch`): `build:storybook` → `build:pages` →
  `actions/deploy-pages`.
- Local static build uses `DEPLOY_TARGET=github-pages`, SPA (`ssr: false`),
  and `app.baseURL=/sandbox/`. Everyday `pnpm dev` / `pnpm build` stay on `/`
  with SSR for Playwright preview.
- One-time repo setup: **Settings → Pages → Source: GitHub Actions** (not a
  `gh-pages` branch).

Editor routes (after Epic 01–02): `/` projects, `/editor/:projectId` editor,
`/docs` kit docs (foundations, components, Storybook). See
[`docs/roadmap.md`](docs/roadmap.md).
