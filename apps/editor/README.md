# @sandbox/editor

Nuxt 4 app: a minimal planner5d-style 2D/3D room editor.

## Structure

```
app/
  core/
    model/            SceneObject hierarchy, ShapeFactory, SceneDocument (OOP domain layer)
    render/
      ISceneRenderer.ts        shared mount/render/dispose contract
      three/                   3D renderer (three.js): ThreeRenderer, ThreeMeshFactory, TextureFactory
      svg/                     2D renderer (SVG): SvgRenderer, Svg2DShapeView, texture patterns
  composables/
    useEditorDocument.ts       Vue-reactive bridge over SceneDocument (provide/inject)
  components/
    EditorToolbar.vue          mode toggle, shape buttons, surface/color pickers
    EditorCanvas3D.vue         mounts ThreeRenderer into a <div>
    EditorCanvas2D.vue         mounts SvgRenderer into a <div>
  pages/index.vue              composes the page, provides the shared document
```

The domain layer (`app/core/model`) and both renderers (`app/core/render/*`)
are plain TypeScript classes with no Vue dependency — they can be unit
tested in isolation (see the co-located `*.spec.ts` files) and are only
wired into Vue's reactivity inside `useEditorDocument.ts`.

Styling is Tailwind CSS v4 (see the root [`README.md`](../../README.md#styling--theming)).
`app.vue` calls `createThemeContext()` once at the app root; `EditorToolbar`
mounts `UiThemeSwitcher` (light/dark/system) next to the delete button.
`app/assets/css/styles.css` is this app's own Tailwind entry point, scoped
to `app/**` and sharing `libs/ui-kit`'s design tokens.

## Scripts

Run from the repo root:

```bash
npx nx run editor:serve      # dev server, http://localhost:4300
npx nx run editor:build      # production build
npx nx run editor:test       # vitest
npx nx run editor:lint       # eslint
npx nx run editor:typecheck  # nuxt prepare + vue-tsc
```
