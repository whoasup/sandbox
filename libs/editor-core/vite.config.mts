/// <reference types='vitest' />
import * as path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/editor-core',
  plugins: [
    // Needed so `@sandbox/source` resolution of `@sandbox/ui-kit` can parse SFCs.
    vue(),
    dts({ entryRoot: 'src', tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json') }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'editor-core',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: ['@sandbox/ui-kit', 'vue'],
    },
  },
  resolve: {
    conditions: ['@sandbox/source'],
  },
  test: {
    name: 'editor-core',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.join(import.meta.dirname, '../../vitest.setup.ts')],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
      // Domain gate: fail if model-layer statement coverage drops below 70%.
      include: ['src/model/**/*.{ts,vue}'],
      exclude: ['**/*.{spec,test}.{ts,tsx,js}', '**/index.ts'],
      thresholds: {
        statements: 70,
      },
    },
  },
}));
