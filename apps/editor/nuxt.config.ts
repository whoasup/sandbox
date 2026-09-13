import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';

/** Static SPA build for GitHub Pages (`pnpm build:pages`). Local/CI keep SSR. */
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  compatibilityDate: '2026-08-26',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4300,
  },
  ssr: !isGitHubPages,
  typescript: {
    typeCheck: false,
    tsConfig: {
      // Nuxt copies this string as-is into `./.nuxt/tsconfig.json`, so it
      // must be relative to that directory rather than to this file.
      extends: '../../../tsconfig.base.json',
      // The workspace base is a composite library config. This app typechecks
      // with `--noEmit` and must not inherit declaration emit, or vue-tsc
      // reports TS2883 on `defineNuxtConfig`'s inferred export type.
      compilerOptions: {
        composite: false,
        declaration: false,
        declarationMap: false,
        emitDeclarationOnly: false,
      },
    },
  },
  imports: {
    autoImport: true,
  },
  css: ['@sandbox/ui-kit/styles.css', '~/assets/css/styles.css'],
  vite: {
    // `@sandbox/source` is the workspace export condition declared in
    // tsconfig.base.json. Resolving it in Vite too means the app consumes
    // ui-kit's sources directly in dev, with full HMR and no build step.
    resolve: {
      conditions: ['@sandbox/source'],
    },
    ssr: {
      noExternal: ['@sandbox/ui-kit', '@sandbox/editor-core'],
      resolve: {
        conditions: ['@sandbox/source'],
        externalConditions: ['@sandbox/source'],
      },
    },
    plugins: [tailwindcss()],
  },
  app: {
    baseURL: isGitHubPages ? '/sandbox/' : '/',
    head: {
      title: 'Sandbox',
      titleTemplate: '%s · Sandbox',
      // Sets `data-theme` before Vue hydrates/paints, so the correct theme
      // (persisted choice, or the OS preference when `system`) applies with
      // no flash of the wrong theme. Mirrors `useTheme()`'s own resolution
      // logic — keep the two in sync if that composable changes.
      script: [
        {
          key: 'theme-boot',
          innerHTML: `(function(){try{var s=localStorage.getItem('ui-theme');var p=s==='light'||s==='dark'||s==='system'?s:'system';var r=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`,
        },
      ],
    },
  },
  ...(isGitHubPages
    ? {
        nitro: {
          preset: 'github_pages',
        },
      }
    : {}),
});
