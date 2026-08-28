import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  compatibilityDate: '2026-08-26',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4300,
  },
  ssr: true,
  typescript: {
    typeCheck: false,
    tsConfig: {
      // Nuxt copies this string as-is into `./.nuxt/tsconfig.json`, so it
      // must be relative to that directory rather than to this file.
      extends: '../../../tsconfig.base.json',
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
      noExternal: ['@sandbox/ui-kit'],
      resolve: {
        conditions: ['@sandbox/source'],
        externalConditions: ['@sandbox/source'],
      },
    },
  },
});
