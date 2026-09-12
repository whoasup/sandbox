# Epic 15 — Domain lib + perf / tech debt

Status: **planned**  
Branch: `epic/15-domain-lib-perf`  
Depends on: Epic 10, Epic 11  
Owners: `libs/editor-core` (new) + `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Extract framework-agnostic editor domain into **`libs/editor-core`**:
   `SceneDocument`, shapes, walls, rooms, openings, furniture, stairs,
   settings, snapshots, migrations, history helpers if already present.
2. Leave Vue composables, Nuxt pages, and SVG/Three renderers in
   `apps/editor`, importing `@sandbox/editor-core`.
3. **Lazy-load** three.js / 3D canvas (and heavy export paths if already
   merged) to shrink the main client chunk.
4. Deduplicate snapshot types and tighten the `ISceneRenderer` boundary
   comments/types after the move.

## 2. User stories

- As a developer, I can unit-test the whole document model without
  booting Nuxt or Vue.
- As a user, the editor first paint stays usable while 3D code loads
  behind `ClientOnly` / dynamic import.
- As a maintainer, domain migrations live in one package used by the app
  and by tests.

## 3. Technical design

### New package

```text
libs/editor-core/
  package.json          name: @sandbox/editor-core
  src/index.ts
  src/model/            SceneDocument, shapes, walls, rooms, …
  src/persistence/      migrations, serialize types
  src/history/          if Epic 09 already landed — move with domain
  vite.config / tsconfig.lib.json
```

- Wire into `pnpm-workspace.yaml` / Nx project graph (`@nx/js` library
  build or Vite lib mode consistent with ui-kit).
- App imports: `@sandbox/editor-core` with workspace export condition
  mirroring `@sandbox/source` if useful for HMR.
- **Depends on 11** so furniture types move once, not twice. Stairs
  (Epic 12) may still be in-flight: if 12 is merged first, include stairs
  in the move; if not, leave a clear `// Epic 12` seam and move stairs in
  a follow-up commit on the same branch once 12 merges — prefer waiting
  for 12 if both are ready.

### Perf

- Dynamic `import()` for `ThreeRenderer` / `EditorCanvas3D` so `three` is
  not on the critical path of `/` or docs routes.
- Confirm Nuxt/Vite chunking: editor route async where practical.
- Keep 2D SVG path eager or separately chunked — 2D should work while 3D
  loads (existing fallback copy is fine).

### Renderer contract

- `ISceneRenderer` may stay in `apps/editor` (depends on DOM) **or** move
  a DOM-free interface stub to editor-core — **keep the interface next to
  renderers in the app** to avoid pulling DOM types into core.
- Core exposes document events only; renderers subscribe as today.

## 4. UI

No new product UI. Loading state for 3D canvas may show the existing
«Загрузка редактора…» fallback until the dynamic import resolves.

## 5. Files to touch (expected)

- `libs/editor-core/**` (new package)
- Move `apps/editor/app/core/model/**`, persistence, related specs
- Update imports across editor app + tests
- `pnpm-workspace.yaml`, root tsconfig references, Nx config
- `EditorCanvas3D.vue` — dynamic import
- Optional: `package.json` path / project.json for editor-core
- README monorepo diagram: three packages

## 6. Tests

- Existing domain specs move with the package and still pass via
  `nx run editor-core:test` or vitest project
- App tests import core and pass
- Smoke: `pnpm build` shows a separate chunk containing `three` (spot-
  check build output in PR description)
- No behavior change to placement / selection / furniture

## 7. Definition of Done

- [ ] `@sandbox/editor-core` builds and is the sole owner of domain +
      migrations used by the app
- [ ] `apps/editor` has no duplicate `SceneDocument` implementation
- [ ] 3D / three.js loads via dynamic import; `/` and `/docs` do not
      eagerly pull three
- [ ] All previous unit tests green under the new layout
- [ ] Green lint / typecheck / test / build

## 8. Out of scope

- Replacing Vite / Nuxt / pnpm
- SSR for three.js
- Microfrontends / Module Federation
- Moving SVG/Three renderers into a separate package
- Rewriting history (Epic 09) algorithms — only relocate if already
  present
