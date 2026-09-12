# Epic 14 — CI, E2E, quality gates

Status: **implemented**  
Branch: `epic/14-ci-e2e`  
Depends on: Epic 05  
Owners: repo root / `apps/editor` (Playwright) / `libs/ui-kit` (test noise)

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Add **GitHub Actions** CI on Node 22: install, lint, stylelint,
   typecheck, unit tests, build.
2. Add a **Playwright** smoke E2E: library → open/create project → editor
   → add a primitive.
3. Raise confidence with a **Vitest coverage threshold** on domain tests
   and silence `HTMLCanvasElement.getContext` noise (canvas mock or
   `canvas` package in test setup).

## 2. User stories

- As a maintainer, every PR runs the same checks I run locally on Node 22.
- As a maintainer, a smoke E2E fails if routing or basic editor placement
  regresses.
- As a developer, unit test output is not flooded with jsdom canvas
  warnings.

## 3. Technical design

### CI workflow

- File: `.github/workflows/ci.yml`
- Trigger: `pull_request` + `push` to default branch
- Steps: checkout → pnpm + Node 22 → `pnpm install` →
  `pnpm lint` → `pnpm lint:style` → `pnpm typecheck` → `pnpm test` →
  `pnpm build` → Playwright install + `pnpm e2e` (or `nx` target)
- Cache pnpm store; fail fast on first script error

### E2E smoke

```text
open /
create or open project
land on /editor/:projectId
click add cube (or equivalent)
assert one shape exists in the UI (test id or canvas sibling list)
```

- Use Playwright against `pnpm preview` of the Nuxt build **or**
  `nuxt dev` with a readiness wait — prefer **preview of production
  build** in CI for stability.
- Seed IndexedDB via a test helper if create-flow is awkward; document
  the approach in the epic PR.
- One optional screenshot assert on the editor toolbar (not a full visual
  regression suite; no Chromatic).

**Implemented approach:** Chromium hits the real `/` create button
(`data-testid="projects-create"`), which writes IndexedDB then navigates —
no seed helper. `playwright.config.ts` starts `nuxt preview` of the
already-built `.output` (CI runs `pnpm build` first). Assertions use
`add-shape-cube`, `shape-inspector`, and `scene-shape` test ids.

### Coverage + canvas

- Vitest coverage for editor domain (and later `libs/editor-core`) with a
  modest threshold (e.g. statements ≥ 70% on `app/core/model/**` — set
  the number in config and stick to it).
- Test setup: mock `HTMLCanvasElement.prototype.getContext` or depend on
  `canvas` for Node — pick one and apply in shared Vitest setup so ui-kit
  texture tests stay quiet.

**Implemented:** `vitest.setup.ts` mocks `getContext('2d')` + `toDataURL`;
editor Vitest enables coverage with `include: app/core/model/**` and
`thresholds.statements: 70`.

### package.json scripts

- `e2e`: Playwright test runner
- CI uses the same scripts humans use locally

## 4. UI

No product UI. Add `data-testid` hooks only where E2E needs them
(toolbar add-cube, project create button).

## 5. Files to touch (expected)

- `.github/workflows/ci.yml`
- `apps/editor/e2e/**` or repo-root `e2e/**`
- `playwright.config.ts`
- Root `package.json` scripts
- Vitest coverage config (`vitest.config.*` / project configs)
- Shared test setup for canvas mock
- Minimal `data-testid` attributes in editor components

## 6. Tests

- CI workflow validates by running green on the PR that introduces it
- Playwright smoke is the E2E suite for this epic
- Unit coverage report published in CI logs (fail under threshold)

## 7. Definition of Done

- [x] CI workflow green on the epic branch / PR
- [x] Smoke E2E covers library → editor → add primitive
- [x] Canvas getContext warnings gone from unit test runs
- [x] Coverage gate enforced for domain unit tests
- [x] Green lint / typecheck / test / build locally and in CI

## 8. Out of scope

- Chromatic / Percy / full visual regression SaaS
- Mobile device matrix
- Load / performance benchmarks in CI
- Deploy previews (Vercel etc.)
- Expanding E2E to walls/furniture (follow-up after those epics merge;
  smoke may stay primitive-only until then)
