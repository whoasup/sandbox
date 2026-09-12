# @sandbox/editor

Nuxt 4 app: a minimal planner5d-style 2D/3D room editor.

## Routes

| Path | Page |
|------|------|
| `/` | Project library stub (draft card until Epic 05) |
| `/editor/:projectId` | Room editor (toolbar + 2D/3D canvases) |
| `/docs` | ui-kit docs hub (overview) |
| `/docs/foundations` | Tokens, shapes, textures |
| `/docs/components` | Component index + live demos |
| `/docs/storybook` | Storybook iframe (dev `:4400` / prod static) |

Shell: `app/layouts/default.vue` + `AppSidebar` (Проекты / Редактор /
Документация) with `UiThemeSwitcher`. Editor document context is created
only on `/editor/:projectId`.

Build static Storybook into the editor public folder:

```bash
pnpm build:storybook   # → apps/editor/public/docs-storybook
```

## Structure

```
app/
  layouts/
    default.vue           sidebar shell + page slot
  pages/
    index.vue             project library stub
    editor/[projectId].vue  editor (document context lives here)
    docs/index.vue        docs hub stub
  core/
    model/            SceneObject hierarchy, ShapeFactory, SceneDocument (OOP domain layer)
    export/           PNG / SVG / glTF builders + ExportService
    render/
      ISceneRenderer.ts        shared mount/render/dispose contract
      three/                   3D renderer (three.js): ThreeRenderer, ThreeMeshFactory, TextureFactory
      svg/                     2D renderer (SVG): SvgRenderer, Svg2DShapeView, texture patterns
  composables/
    useEditorDocument.ts       Vue-reactive bridge over SceneDocument (provide/inject)
  components/
    AppSidebar.vue             shell navigation + theme switcher
    EditorToolbar.vue          mode toggle, shape buttons, surface/color pickers, export slot
    EditorExportMenu.vue       Экспорт: PNG / SVG / glTF / Проект JSON…
    EditorCanvas3D.vue         mounts ThreeRenderer into a <div>
    EditorCanvas2D.vue         mounts SvgRenderer into a <div>
  constants/
    projects.ts                DRAFT_PROJECT_ID stub
```

The domain layer (`app/core/model`) and both renderers (`app/core/render/*`)
are plain TypeScript classes with no Vue dependency — they can be unit
tested in isolation (see the co-located `*.spec.ts` files) and are only
wired into Vue's reactivity inside `useEditorDocument.ts`.

Styling is Tailwind CSS v4 (see the root [`README.md`](../../README.md#styling--theming)).
`app.vue` calls `createThemeContext()` once at the app root; the shell
sidebar mounts `UiThemeSwitcher` (light/dark/system).
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
