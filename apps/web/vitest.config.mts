/// <reference types='vitest' />
import * as path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  plugins: [vue()],
  resolve: {
    // Mirrors the Nuxt aliases so specs can import app code the same way pages do.
    alias: {
      '~': path.join(import.meta.dirname, 'app'),
      '@': path.join(import.meta.dirname, 'app'),
    },
    conditions: ['@sandbox/source'],
  },
  test: {
    name: 'web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{app,src,server,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
