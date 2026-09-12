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
    setupFiles: [path.join(import.meta.dirname, '../../vitest.setup.ts')],
    include: ['{app,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
      // Domain gate: fail if model-layer statement coverage drops below 70%.
      include: ['app/core/model/**/*.{ts,vue}'],
      exclude: ['**/*.{spec,test}.{ts,tsx,js}', '**/index.ts'],
      thresholds: {
        statements: 70,
      },
    },
  },
}));
