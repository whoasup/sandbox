# @sandbox/web

Nuxt 4 application that renders TresJS scenes with components from `@sandbox/ui-kit`.

## Development

```bash
npx nx run web:serve       # dev server on http://localhost:4200
npx nx run web:build       # production build into .output/
npx nx run web:test        # vitest
npx nx run web:typecheck   # nuxt prepare + vue-tsc
```

## Layout

```
app/
├── app.vue            shell: header, theme toggle, footer
├── assets/css/        layout helpers built on top of the ui-kit tokens
├── components/
│   ├── SceneStage.vue TresCanvas, camera, lights, orbit controls
│   └── SceneShape.vue the animated mesh; uses useLoop() from @tresjs/core
├── composables/       useSceneSettings — shared state for the playground panel
└── pages/             file based routing: / and /playground
server/api/            Nitro route example
```

## Notes

- `<TresCanvas>` is wrapped in `<ClientOnly>`: WebGL has no server-side equivalent.
- `useLoop()` requires the TresJS context, so per-frame animation has to live in a
  component rendered *inside* `<TresCanvas>`, not in the page.
- TresJS prop types are generated from the Three.js classes, so `new Vector3(...)`
  type checks while the `[x, y, z]` shorthand does not, even though both work at runtime.
- The app resolves `@sandbox/ui-kit` to its TypeScript sources through the
  `@sandbox/source` export condition declared in `nuxt.config.ts`.
