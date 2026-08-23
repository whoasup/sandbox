# sandbox

Песочница для практики **Nuxt 4 + TresJS (Three.js)** с собственной дизайн-системой.
Это Nx-монорепозиторий из двух проектов: библиотеки компонентов и приложения, которое её использует.

```
.
├── apps/
│   └── web/            @sandbox/web    — Nuxt 4 приложение с 3D-сценами на TresJS
├── libs/
│   └── ui-kit/         @sandbox/ui-kit — Vue 3 компоненты, дизайн-токены, Storybook
├── nx.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Требования

- Node.js >= 20 (проверено на 22)
- pnpm >= 10

## Быстрый старт

```bash
pnpm install

pnpm dev         # Nuxt приложение   → http://localhost:4200
pnpm storybook   # Storybook ui-kit  → http://localhost:4400
```

## Команды

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | dev-сервер Nuxt (`nx run web:serve`) |
| `pnpm storybook` | dev-сервер Storybook (`nx run ui-kit:storybook`) |
| `pnpm build` | сборка всех проектов (`nx run-many -t build`) |
| `pnpm test` | юнит-тесты Vitest во всех проектах |
| `pnpm lint` | ESLint во всех проектах |
| `npx nx run-many -t typecheck` | проверка типов (`vue-tsc`) |
| `npx nx run ui-kit:build-storybook` | статическая сборка Storybook |
| `npx nx graph` | граф зависимостей проектов |

Nx кеширует результаты задач, поэтому повторные запуски почти мгновенные.
Добавьте `--skip-nx-cache`, если нужен «чистый» прогон.

## Как связаны проекты

`apps/web` зависит от `@sandbox/ui-kit` как от обычного workspace-пакета
(`"@sandbox/ui-kit": "workspace:*"`). Nx строит граф по этой зависимости,
поэтому сборка приложения автоматически учитывает библиотеку.

В dev-режиме приложение подключает **исходники** библиотеки, а не сборку:
`tsconfig.base.json` объявляет условие экспорта `@sandbox/source`, и то же условие
включено в `vite.resolve.conditions` в `apps/web/nuxt.config.ts`. Благодаря этому
правка компонента в `libs/ui-kit` сразу видна в браузере без пересборки.

## Дизайн-система

Токены живут в `libs/ui-kit/src/styles/tokens.css` и разделены на два слоя:

1. **примитивы** — `--ui-palette-*`, `--ui-font-size-*`, `--ui-space-*` и т. д.;
2. **семантические** — `--ui-color-surface`, `--ui-color-primary`, `--ui-shadow-md` …

Компоненты используют только семантический слой, а темы (`light` / `dark`)
переопределяют его через атрибут `data-theme` на `<html>`. Переключатель темы в
приложении — это композабл `useTheme()` из ui-kit.

Для кода, который не может использовать CSS-классы (например, материалы Three.js),
те же токены доступны как типизированный объект:

```ts
import { tokens } from '@sandbox/ui-kit';

tokens.color.primary; // 'var(--ui-color-primary)'
```

## Компоненты ui-kit

| Компонент | Основное |
| --- | --- |
| `UiButton` | варианты `primary / secondary / ghost / danger`, размеры, состояния loading и disabled, слоты `leading` / `trailing` |
| `UiInput` | label, hint, ошибка, размеры, слоты для иконок, связка `label ↔ input ↔ aria-describedby` |
| `UiModal` | teleport в `body`, focus-trap, блокировка скролла, закрытие по overlay и Escape, слоты `header` / `footer` |
| `UiText` | шкала типографики (`display … caption`, `code`), тона, выравнивание, обрезка строки |

Каждый компонент задокументирован в Storybook (`Components/*`), а токены —
в разделе `Foundations/Design tokens`.

## Приложение

- `/` — обзор: сцена TresJS и компоненты кита в реальном использовании.
- `/playground` — интерактивная сцена: геометрия, цвет материала, скорость вращения,
  wireframe и авто-орбита. Вся панель управления собрана из компонентов ui-kit.

3D-сцена вынесена в `apps/web/app/components/SceneStage.vue` и обёрнута в
`<ClientOnly>`, потому что WebGL существует только в браузере. Анимация живёт в
`SceneShape.vue`: `useLoop()` из `@tresjs/core` работает только внутри `<TresCanvas>`.

## Куда добавлять новое

- **новый компонент** — `libs/ui-kit/src/components/<Name>/`, рядом `*.stories.ts`
  и `*.spec.ts`, затем экспорт из `libs/ui-kit/src/index.ts`;
- **новая страница** — `apps/web/app/pages/*.vue` (роутинг файловый);
- **новый токен** — `libs/ui-kit/src/styles/tokens.css` и, если нужен из JS,
  `libs/ui-kit/src/tokens/index.ts`.
