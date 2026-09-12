import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 4310);
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Prefer Nuxt production preview for E2E stability (same artifact CI builds).
 * Requires `pnpm build` (or at least `nx run editor:build`) beforehand.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `PORT=${port} NITRO_PORT=${port} pnpm exec nuxt preview --cwd apps/editor --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
