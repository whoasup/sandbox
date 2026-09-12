# @sandbox/ui-kit

Vue 3 + TypeScript design system: buttons, shapes, textures, text, and a
handful of framework-agnostic helpers/utils, documented with Storybook.

## Structure

```
src/
  components/
    UiButton/            button (variants, sizes, icon slot)
    UiText/               typography primitive (`as` polymorphic tag)
    UiToggleGroup/        segmented control (used for the editor's 2D/3D switch)
    UiShapeIcon/           inline SVG icon for a ShapeKind (cube/sphere/cylinder/pyramid)
    UiTextureSwatch/       canvas preview of a surface texture
    UiThemeSwitcher/       light/dark/system control, built on UiToggleGroup
  shapes/                  ShapeKind type + SHAPE_CATALOG (shared vocabulary of placeable shapes)
  textures/                SurfaceKind type + TEXTURE_DEFINITIONS + drawTexturePattern
                           (the single canvas-drawing routine reused by the 3D CanvasTexture
                            material, the 2D SVG pattern fill, and this swatch component)
  composables/             useTheme() / createThemeContext() — the light/dark/system state
                           UiThemeSwitcher reads from and writes to (provide/inject, SSR-safe)
  helpers/                 EventEmitter, classNames, createId
  utils/                   clamp, color (hex <-> rgb, shade)
  tokens/                  typed mirror of styles/theme.css + tokens.css, for non-CSS consumers
  styles/                  theme.css (Tailwind @theme primitives), tokens.css (semantic
                           aliases, bridged into Tailwind via @theme inline), base.css
```

Each component ships with a `.stories.ts` (Storybook) and a `.spec.ts`
(Vitest + `@vue/test-utils`) file next to it. Components style themselves
with Tailwind utility classes (via the `classNames()` helper) rather than
scoped `<style>` blocks; each still keeps its original BEM-style root/
modifier class names as inert markers for tests and CSS escape hatches.
See the root [`README.md`](../../README.md#styling--theming) for how the
token/theming architecture fits together across `ui-kit` and `editor`.

## Scripts

Run from the repo root:

```bash
npx nx run ui-kit:storybook  # dev server, http://localhost:4400
npx nx run ui-kit:build      # library build (vite lib mode + d.ts)
npx nx run ui-kit:test       # vitest
npx nx run ui-kit:lint       # eslint
npx nx run ui-kit:typecheck  # vue-tsc --build
```
