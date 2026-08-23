import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4200,
  },
  modules: ['@tresjs/nuxt'],
  typescript: {
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json', // Nuxt copies this string as-is to the `./.nuxt/tsconfig.json`, therefore it needs to be relative to that directory
    },
  },
  imports: {
    autoImport: true,
  },
  css: ['@sandbox/ui-kit/styles.css', '~/assets/css/styles.css'],
  vite: {
    // `@sandbox/source` is the workspace export condition Nx adds in tsconfig.base.json.
    // Resolving it in Vite too means the app consumes ui-kit sources directly, so the
    // library gets full HMR without a build step.
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
