# Tailwind CSS migration plan

Status: **implemented** — see the `feat/tailwind-migration-*` branch/PR.
This document is kept as the design rationale (token architecture, theme
switcher design, contrast decisions, multi-package Tailwind wiring); code
comments throughout `libs/ui-kit/src/styles/` and `useTheme.ts` reference
it by name. The plan below was written before implementation and mostly
matches what shipped; where implementation diverged (component-by-component
commit granularity was consolidated, `--ui-space-*`/`--ui-radius-*` were
dropped rather than kept as transitional aliases, `libs/ui-kit`'s own
`dist/index.css` was fixed to actually bundle the compiled Tailwind output),
the code and its own comments are the source of truth.

Owners: ui-kit (`libs/ui-kit`) + editor (`apps/editor`)

## 1. Goals

1. Replace the hand-rolled CSS (scoped Vue `<style>` blocks + a manually
   maintained token stylesheet) with Tailwind CSS as the styling engine for
   both `libs/ui-kit` and `apps/editor`.
2. Keep the existing **two-layer token model** (primitives → semantic
   aliases) as the source of truth for theming, but express it through
   Tailwind's CSS-first `@theme` config instead of a bespoke
   `styles/tokens.css`.
3. Ship **custom theming** with three user-facing states — `light`, `dark`,
   `system` — persisted across reloads, with no flash-of-wrong-theme (FOWT)
   on load.
4. Change the brand/primary accent color from blue to **orange**, defined
   as a full primitive scale (not a single hard-coded hex) so it can be
   reused for hover/active/focus states and future data-viz needs.
5. Land the migration incrementally, component by component, so the app and
   Storybook stay green (lint/typecheck/test/build) after every step.

## 2. Current state (audit)

- **Monorepo**: Nx 23 + pnpm workspaces. Two projects: `apps/editor` (Nuxt 4)
  and `libs/ui-kit` (Vue 3 library, built with Vite lib mode, documented in
  Storybook 10).
- **Styling today**: no Tailwind, no CSS framework. Plain CSS:
  - `libs/ui-kit/src/styles/tokens.css` — primitives (`--ui-palette-*`,
    spacing, radii, typography) plus a semantic layer overridden per
    `[data-theme='light'|'dark']` (`--ui-color-*`, `--ui-shadow-*`).
  - `libs/ui-kit/src/styles/base.css` — global resets.
  - Every `Ui*` component has its own `<style scoped>` block that consumes
    only the semantic `--ui-color-*` / `--ui-space-*` / `--ui-radius-*`
    variables (never primitives directly), keeping components
    theme-agnostic. Variants (`ui-button--primary`, `--secondary`, …) are
    plain class selectors built with a small `classNames()` helper.
  - `libs/ui-kit/src/tokens/index.ts` is a **typed, hand-synced mirror** of
    the same palette, consumed by non-CSS code (three.js materials in
    `apps/editor`).
  - `apps/editor/app/assets/css/styles.css` has one page-level rule; the
    app otherwise relies entirely on ui-kit's exported `styles.css` +
    inline `<style>` in `app.vue`.
- **Theming today**: only `data-theme="light"` / `"dark"` selectors exist in
  CSS. There is **no runtime theme switcher** anywhere in `apps/editor`, and
  **no "system" concept** at all.
- **Storybook already has partial theme infrastructure**:
  `@storybook/addon-themes` is installed and wired in
  `libs/ui-kit/.storybook/preview.ts` via `withThemeByDataAttribute` with
  only `light`/`dark` entries — no `system`, and this only affects the
  Storybook preview iframe, not the real app.
- **Reusable primitive for a 3-way switcher**: `UiToggleGroup` is already a
  generic, accessible (`role="tablist"`/`role="tab"`) segmented control used
  for the 2D/3D mode switch. It's a good fit for the light/dark/system
  control without building a new primitive.
- **Linting**: Stylelint (`stylelint-config-standard` +
  `stylelint-config-recommended-vue`, `postcss-html` for `.vue`) will reject
  Tailwind's v4 at-rules (`@theme`, `@utility`, `@custom-variant`, `@source`,
  `@apply`) out of the box and needs explicit config.
- **Build tooling**: Vite everywhere (Nuxt's Vite under the hood, ui-kit's
  own `vite.config.mts` lib build, Storybook's `vite.config.mts` builder).
  Tailwind v4 ships an official `@tailwindcss/vite` plugin, which is the
  natural fit here (no PostCSS config file needed).
- **Package boundary constraint**: `libs/ui-kit` builds to a single
  `dist/index.css` bundle (`cssFileName: 'index'` in its Vite lib config)
  that `apps/editor` imports as `@sandbox/ui-kit/styles.css`. Any Tailwind
  utility classes used *inside* ui-kit component templates must be compiled
  **by ui-kit's own build**, not the app's — this is a standard Tailwind v4
  monorepo pattern (each package runs its own content scan) but must be
  called out explicitly so utilities aren't silently missing from the
  shipped bundle.

## 3. Target architecture

### 3.1 Tailwind wiring

- Adopt **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`
  required) via `@tailwindcss/vite`.
- Add the plugin in three places, since Storybook and the ui-kit lib build
  do not inherit Nuxt's Vite config:
  1. `apps/editor/nuxt.config.ts` → `vite.plugins`.
  2. `libs/ui-kit/vite.config.mts` → `plugins`.
  3. `libs/ui-kit/.storybook/main.ts` (via its referenced
     `vite.config.mts`, or a Storybook-specific viteFinal override).
- Introduce a **shared theme partial** so both packages compile from the
  same design tokens instead of duplicating `@theme` blocks:
  - `libs/ui-kit/src/styles/theme.css` — the new home for primitives and
    the `@theme { … }` block Tailwind reads to generate utilities
    (`bg-primary`, `text-muted`, `rounded-md`, etc.).
  - `libs/ui-kit/src/styles/index.css` becomes the Tailwind entry point:
    ```css
    @import 'tailwindcss';
    @import './theme.css';
    @import './base.css';
    ```
  - `apps/editor/app/assets/css/styles.css` becomes its own Tailwind entry
    that imports the same theme partial from ui-kit (via the package's
    `@sandbox/source` export condition already used for source-level
    resolution), plus an explicit `@source` directive pointing at
    `libs/ui-kit/src` so the editor's own Tailwind build also class-scans
    ui-kit's Vue templates if the app ever composes ui-kit classes
    directly (defense in depth; ui-kit's own compiled CSS remains the
    primary source of its component styles).

### 3.2 Token model → Tailwind `@theme`

Keep the **two-layer** shape, just re-hosted:

- **Primitives** (`--color-orange-50…950`, `--color-gray-50…950`,
  `--space-*`, `--radius-*`, font tokens) go in an `@theme` block — Tailwind
  auto-generates matching utilities (`bg-orange-500`, `p-4`, `rounded-lg`,
  …) and matching `--color-orange-500` custom properties for free.
- **Semantic aliases** (`--ui-color-surface`, `--ui-color-primary`,
  `--ui-color-text`, …) stay as plain runtime CSS variables, scoped under
  `:root`/`[data-theme='light']` and `[data-theme='dark']` exactly as
  today, just referencing the new `--color-orange-*` / `--color-gray-*`
  primitives instead of `--ui-palette-blue-*`.
- Bridge the two with Tailwind v4's `@theme inline` so semantic utilities
  exist too, without baking a specific theme's value at build time:
  ```css
  @theme inline {
    --color-primary: var(--ui-color-primary);
    --color-surface: var(--ui-color-surface);
    --color-text: var(--ui-color-text);
    /* … */
  }
  ```
  This makes `bg-primary`, `text-text`, `border-surface`-style utilities
  resolve to whatever the *current* `data-theme` sets at runtime — so
  switching themes needs zero rebuild, exactly like today.
- Rename `--ui-palette-*` → the Tailwind-idiomatic `--color-*` naming so
  the generated utility classes read naturally, and update
  `libs/ui-kit/src/tokens/index.ts` (the typed mirror for three.js/non-CSS
  consumers) to match the new orange-based values.
- Add a `dark:` variant hook via `@custom-variant`, so plain Tailwind
  utilities can express dark-mode overrides directly in markup when a
  semantic alias doesn't exist yet:
  ```css
  @custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
  ```

### 3.3 Orange accent palette

- Define a full 11-step scale (`50`→`950`) for the accent color instead of
  a single hex, e.g. seeded from Tailwind's own `orange` scale or a custom
  curated ramp (decision needed — see §7):
  - `--color-orange-50` … `--color-orange-950`.
- Map semantic aliases onto it per theme, keeping the existing naming so
  component code doesn't change:
  - Light: `--ui-color-primary: var(--color-orange-500)`,
    `--ui-color-primary-hover: var(--color-orange-600)`,
    `--ui-color-primary-active: var(--color-orange-700)`.
  - Dark: shift one or two steps lighter for sufficient contrast on dark
    surfaces, e.g. `--ui-color-primary: var(--color-orange-400)`,
    `hover: var(--color-orange-500)`, `active: var(--color-orange-600)`.
- **Contrast check required**: orange-on-white and white-on-orange text
  contrast (`--ui-color-text-on-primary`) must be verified against WCAG AA
  (4.5:1 for text) for both themes before landing — orange scales often
  need a darker-than-500 shade for `text-on-primary` to pass at normal
  weight. Validate with Storybook's `@storybook/addon-a11y` (already
  installed) plus a manual contrast check.
- Keep `--ui-color-danger` (red) and `--ui-color-success` (green) distinct
  from the new orange accent so status colors and brand color don't
  collide visually.

### 3.4 Theme switcher (light / dark / system)

- **Composable** (new, `libs/ui-kit/src/composables/useTheme.ts` or
  `apps/editor/app/composables/useTheme.ts` — decision needed on which
  layer owns it, see §7): exposes
  - `preference: Ref<'light' | 'dark' | 'system'>` — the user's stored
    choice.
  - `resolvedTheme: ComputedRef<'light' | 'dark'>` — what's actually
    applied (`preference` resolved against `matchMedia
    ('(prefers-color-scheme: dark)')` when `preference === 'system'`).
  - `setTheme(pref)` — updates the ref, `localStorage`, and the
    `data-theme` attribute on `<html>`.
  - A `matchMedia` change listener that re-resolves `resolvedTheme` live
    when `preference === 'system'` and the OS setting flips while the app
    is open.
- **No-flash SSR bootstrap**: inject a tiny inline, blocking `<script>` via
  Nuxt's `app.head.script` (runs before hydration/paint) that reads
  `localStorage.theme` (fallback `'system'`), resolves it against
  `matchMedia`, and sets `document.documentElement.dataset.theme`
  synchronously — the same pattern used by libraries like `next-themes`.
  This avoids a light→dark (or dark→light) flash on first paint and under
  SSR, where the server can't know the client's OS preference.
- **Persistence**: `localStorage` (key e.g. `ui-theme`), read/write only
  client-side; the composable must be SSR-safe (guard `window`/`localStorage`
  access, default to `'system'` during SSR render).
- **UI component**: new `UiThemeSwitcher` in `libs/ui-kit`, built on the
  existing `UiToggleGroup` with three options
  (`{ value: 'light', label: 'Light' }`, `dark`, `system`), wired to
  `useTheme()`. Mount it in `apps/editor/app/components/EditorToolbar.vue`
  next to the existing 2D/3D mode toggle.
- **Storybook parity**: extend `withThemeByDataAttribute` in
  `preview.ts` with a third `system` entry (Storybook's addon can't read
  the *browser's* OS preference on behalf of the iframe automatically, so
  document this as a known limitation — `system` in Storybook simply
  previews whichever theme the toolbar picks, same as `light`/`dark`; real
  OS-driven resolution is only meaningful in the actual app). Alternatively
  add a small custom Storybook decorator that mounts `UiThemeSwitcher`
  itself in a dedicated story so the real runtime behavior (including
  `matchMedia`) can be exercised inside Storybook too.

## 4. Package & tooling changes

| Change | Where |
| --- | --- |
| Add `tailwindcss` (`^4`), `@tailwindcss/vite` | root `devDependencies` (workspace-hoisted) |
| Register `@tailwindcss/vite` plugin | `apps/editor/nuxt.config.ts` (`vite.plugins`), `libs/ui-kit/vite.config.mts`, Storybook's Vite config |
| Stylelint: allow Tailwind at-rules | `.stylelintrc.json` — add `stylelint-config-tailwindcss` (or manually extend `at-rule-no-unknown` ignore list with `theme`, `apply`, `layer`, `utility`, `custom-variant`, `variant`, `source`, `import`) |
| Prettier: Tailwind class sorting (optional) | `prettier-plugin-tailwindcss` in root Prettier config, if we want automatic class ordering |
| Vitest/jsdom: mock `matchMedia` | `vitest.config.ts` / per-project setup file, needed by any test that touches `useTheme()`'s system-detection branch |
| Nx cache inputs | confirm `libs/ui-kit/src/styles/theme.css` and the Tailwind entry CSS are tracked as inputs to `build`/`storybook`/`test` targets (Nx's default `sharedGlobals`/project `inputs` should already pick up CSS changes, but verify after the first build) |

## 5. Migration phases (sequenced, low-risk order)

Each phase should land as its own commit (or small set of commits) so the
repo stays buildable/testable throughout — per the repo's existing
convention of incremental, reviewable changes.

1. **Wire up Tailwind, change nothing visually.**
   Add the plugin + entry CSS + shared `@theme` partial. Re-express the
   *existing* blue-based tokens 1:1 as the new `--color-*` primitives (no
   orange yet, no component changes). Confirm `nx run editor:serve`,
   `nx run ui-kit:storybook`, and `nx run-many -t build,test,lint,typecheck`
   all still pass with an unchanged UI. This isolates "does Tailwind wire
   up correctly in this monorepo" from "does the redesign work."

2. **Switch the accent palette to orange.**
   Replace the blue primitive scale with the orange scale, update semantic
   `--ui-color-primary*` mappings for both themes, update
   `tokens/index.ts`. Verify contrast (§3.3) and check every existing
   `--color-primary`-consuming component (`UiButton` primary/pressed
   variants, `UiToggleGroup` active state) visually in Storybook.

3. **Build the theme switcher infrastructure.**
   `useTheme()` composable, SSR no-flash boot script, `localStorage`
   persistence, `UiThemeSwitcher` component (on `UiToggleGroup`). Add unit
   tests (composable logic, `matchMedia` mocking) and a Storybook story.
   Still no app-visible change yet other than the new component existing
   in isolation.

4. **Mount the switcher in the app.**
   Add `UiThemeSwitcher` to `EditorToolbar.vue`. Manually verify: default
   (`system`) matches OS, toggling to `light`/`dark` sticks across reload,
   no flash on reload, `system` re-reacts live if the OS theme changes
   while the tab is open.

5. **Migrate `libs/ui-kit` components off scoped CSS, one at a time.**
   Order by blast radius (simplest/most-isolated first):
   `UiText` → `UiShapeIcon` → `UiTextureSwatch` → `UiToggleGroup` →
   `UiButton` (most variants, do last). For each: replace the `<style
   scoped>` block with Tailwind utility classes in the template (via the
   existing `classNames()` helper for variant logic), delete the old CSS,
   update/re-run that component's `.spec.ts` (class-name assertions may
   need updating) and `.stories.ts`. Keep semantic-alias-backed utilities
   (`bg-primary`, `text-on-primary`, …) rather than raw palette utilities
   in component code, preserving today's "components never touch
   primitives directly" rule.

6. **Migrate `apps/editor` styles.**
   `app.vue`, `pages/index.vue`, `EditorToolbar.vue`,
   `assets/css/styles.css` → Tailwind utilities; remove the now-empty
   bespoke stylesheet once nothing references it.

7. **Clean up.**
   Delete `styles/tokens.css`/`styles/base.css` if fully superseded (or
   keep `base.css` for the handful of true global resets Tailwind's
   Preflight doesn't cover — decide per Preflight diff). Remove any now-
   unused Stylelint rule overrides. Update `libs/ui-kit/README.md` and
   root `README.md` "Tooling" section to describe the new Tailwind-based
   styling story instead of the current plain-CSS one.

## 6. Testing strategy

- **Automated**
  - `nx run-many -t lint,typecheck,test,build` after every phase — must
    stay green throughout, not just at the end.
  - New unit tests for `useTheme()`: resolves `system` correctly against a
    mocked `matchMedia`, persists/reads `localStorage`, reacts to a
    simulated OS theme-change event, is safe when `window` is undefined
    (SSR).
  - Update existing component `.spec.ts` files where they assert on
    specific class names that change during the CSS migration (they
    currently assert on `ui-button--primary`-style BEM classes via
    `classNames()` — decide in §7 whether to keep those semantic class
    names as hooks for tests/e2e even after adopting Tailwind utilities
    for the actual styling, which is the safer choice).
  - Storybook `test-storybook` (already an Nx target) run against the
    a11y-instrumented stories to catch contrast regressions from the
    orange accent swap.
- **Manual / visual**
  - Storybook: review every story in `light`, `dark`, and toggled `system`
    (via OS setting change) states; specifically eyeball `UiButton`
    primary/pressed and `UiToggleGroup` active states for the new orange
    accent.
  - Running app (`nx run editor:serve`): exercise `UiThemeSwitcher` through
    all three states, hard-reload in each state to confirm no flash and
    correct persistence, and toggle the OS-level color scheme while on
    `system` to confirm live re-resolution.
  - Confirm no regression in the 2D/3D mode toggle or texture/shape
    rendering (three.js reads colors from `tokens/index.ts`, not CSS, so
    verify its orange values visually match the CSS accent).

## 7. Open decisions (need a call before/while implementing)

1. **Orange scale source**: adopt Tailwind's built-in `orange` palette
   as-is, or author a custom curated ramp tuned for this product's
   contrast needs? (Custom is safer for the WCAG check in §3.3 but is more
   work.)
2. **Where does `useTheme()` live** — `libs/ui-kit` (reusable by any future
   app) or `apps/editor` (simplest, since there's currently only one app)?
   Recommendation: `libs/ui-kit`, matching the "framework building blocks
   shared by the editor (and any future app)" charter in its README.
3. **Do we keep BEM-style semantic classes** (`ui-button--primary`) as
   test/e2e hooks alongside Tailwind utility classes, or fully replace them
   with utility classes and re-point tests at `data-testid`/role-based
   queries? Recommendation: keep a minimal semantic class per component
   root (for test stability and CSS escape hatches) and move everything
   else to utilities.
4. **Preflight (Tailwind's base reset) vs. existing `base.css`**: audit the
   diff and decide whether `base.css` can be deleted or must be merged.
5. **`prettier-plugin-tailwindcss`**: adopt now for automatic class
   sorting, or defer to a follow-up? Low risk either way, but touches the
   root Prettier config used by the pre-commit hook.

## 8. Risks

- **Tailwind v4 browser targets**: no fallback for very old browsers
  (roughly Safari <16.4, Chrome <111, Firefox <128 baseline for the modern
  CSS features v4 generates) — acceptable for this sandbox project but
  worth confirming isn't a hard requirement anywhere.
- **Storybook's Vite config is separate from Nuxt's** — easy to forget to
  register `@tailwindcss/vite` there and get "it works in the app but not
  in Storybook" drift. Phase 1's acceptance check explicitly covers both.
- **`libs/ui-kit` ships compiled CSS**: if a consuming app ever styles
  itself using raw ui-kit-exported utility classes that weren't actually
  used inside any ui-kit component template, Tailwind's content scan in
  ui-kit's own build won't have generated them, and they'll silently be
  missing from `dist/index.css`. Mitigated by the `@source` directive in
  the app's own Tailwind entry (§3.1) plus sticking to semantic-alias
  utilities in app code.
- **Test churn**: component specs asserting on class names will need
  updates in phase 5; scope each component's migration commit to include
  its own test updates so failures are attributable.
