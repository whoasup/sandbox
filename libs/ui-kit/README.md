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
  shapes/                  ShapeKind type + SHAPE_CATALOG (shared vocabulary of placeable shapes)
  textures/                SurfaceKind type + TEXTURE_DEFINITIONS + drawTexturePattern
                           (the single canvas-drawing routine reused by the 3D CanvasTexture
                            material, the 2D SVG pattern fill, and this swatch component)
  helpers/                 EventEmitter, classNames, createId
  utils/                   clamp, color (hex <-> rgb, shade)
  tokens/                  typed mirror of styles/tokens.css, for non-CSS consumers
  styles/                  tokens.css (primitives + semantic layers), base.css
```

Each component ships with a `.stories.ts` (Storybook) and a `.spec.ts`
(Vitest + `@vue/test-utils`) file next to it.

## Scripts

Run from the repo root:

```bash
npx nx run ui-kit:storybook  # dev server, http://localhost:4400
npx nx run ui-kit:build      # library build (vite lib mode + d.ts)
npx nx run ui-kit:test       # vitest
npx nx run ui-kit:lint       # eslint
npx nx run ui-kit:typecheck  # vue-tsc --build
```
