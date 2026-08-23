# @sandbox/ui-kit

Vue 3 component library and design tokens for the sandbox workspace.

## Usage

```ts
import { UiButton, UiInput, UiModal, UiText, useTheme } from '@sandbox/ui-kit';
import '@sandbox/ui-kit/styles.css'; // tokens + baseline, also imported by the entry point
```

Themes are switched by setting `data-theme="light" | "dark"` on `<html>`; `useTheme()`
does that for you and persists the choice in `localStorage`.

## Development

```bash
npx nx run ui-kit:storybook          # docs and playground on http://localhost:4400
npx nx run ui-kit:test               # vitest
npx nx run ui-kit:typecheck          # vue-tsc
npx nx run ui-kit:build              # vite library build into dist/
npx nx run ui-kit:build-storybook    # static Storybook into storybook-static/
```

## Layout

```
src/
├── components/     one folder per component: .vue + .stories.ts + .spec.ts + types.ts
├── composables/    useTheme
├── foundations/    Storybook pages documenting the tokens
├── styles/         tokens.css (primitives + semantic layers), base.css, index.css
├── tokens/         typed mirror of the CSS custom properties
└── index.ts        public entry point
```

## Adding a component

1. Create `src/components/UiThing/UiThing.vue`. Style it with `--ui-*` tokens only —
   no hard-coded colours, spacing or radii, otherwise it will not follow the theme.
2. Put exported prop unions in `src/components/UiThing/types.ts`; `<script setup>`
   cannot export types itself.
3. Add `UiThing.stories.ts` (title `Components/Thing`, tag `autodocs`) and `UiThing.spec.ts`.
4. Re-export the component and its types from `src/index.ts`.
