# sandbox

Hard skills practicing sandbox.

Nx monorepo (pnpm workspaces) with two projects:

```
apps/editor   @sandbox/editor   — Nuxt 4 2D/3D room editor (planner5d-style)
libs/ui-kit   @sandbox/ui-kit   — Vue 3 design system, Storybook
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
- Architecture: `app/core/model` (framework-agnostic domain classes),
  `app/core/render/three` and `app/core/render/svg` (the two `ISceneRenderer`
  implementations), `app/composables/useEditorDocument.ts` (Vue-reactive
  bridge, provide/inject), `app/components` (toolbar + canvases).

See [`apps/editor/README.md`](apps/editor/README.md) for scripts and structure.

## `libs/ui-kit`

Framework building blocks shared by the editor (and any future app):
`UiButton`, `UiText`, `UiToggleGroup`, `UiShapeIcon`, `UiTextureSwatch`,
two-layer design tokens (CSS variables + a typed mirror), and small
dependency-free helpers/utils (`EventEmitter`, `classNames`, `createId`,
`clamp`, color helpers). Documented and tested in Storybook + Vitest.

See [`libs/ui-kit/README.md`](libs/ui-kit/README.md) for scripts and structure.

## Tooling

- **Language**: TypeScript everywhere, OOP for the editor's domain/render
  layer (abstract base classes, factories, encapsulated renderer classes).
- **Bundler**: Vite (both the ui-kit library build and, under the hood,
  Nuxt's dev/build pipeline).
- **Linting**: ESLint (flat config, `@nx/eslint-plugin` + `eslint-plugin-vue`)
  and Stylelint (`stylelint-config-standard` + Vue SFC `<style>` support).
- **Testing**: Vitest + `@vue/test-utils` for unit/component tests,
  Storybook for interactive component documentation.
- **Monorepo**: Nx 23 (pnpm workspaces), with project-level `build`, `test`,
  `lint`, `typecheck` targets inferred from each project's own config.

## Scripts

```bash
pnpm install

pnpm dev         # nx run editor:serve   — http://localhost:4300
pnpm storybook   # nx run ui-kit:storybook — http://localhost:4400

pnpm build       # nx run-many -t build
pnpm test        # nx run-many -t test
pnpm lint        # nx run-many -t lint
pnpm lint:style  # stylelint "**/*.{css,vue}"
pnpm typecheck   # nx run-many -t typecheck
```
