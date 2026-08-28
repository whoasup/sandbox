/// <reference types='vitest' />
import * as path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/editor',
  plugins: [vue()],
  resolve: {
    alias: {
      '~': path.join(import.meta.dirname, 'app'),
      '@': path.join(import.meta.dirname, 'app'),
    },
    conditions: ['@sandbox/source'],
  },
  test: {
    name: 'editor',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{app,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
