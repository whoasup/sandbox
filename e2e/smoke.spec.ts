import { expect, test } from '@playwright/test';

/**
 * Smoke: library → create project → editor → add cube.
 * Uses IndexedDB in a real Chromium context (no seed helper needed —
 * the projects page create button writes a record then navigates).
 */
test('library create project add cube', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('projects-page')).toBeVisible();
  await page.getByTestId('projects-create').click();

  await expect(page).toHaveURL(/\/editor\/.+/);
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('editor-toolbar')).toBeVisible();

  await page.getByTestId('add-shape-cube').click();
  await expect(page.getByTestId('shape-inspector')).toBeVisible();
  await expect(page.getByTestId('scene-shape')).toHaveCount(1);
});
