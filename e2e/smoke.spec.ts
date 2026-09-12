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

test('mobile viewport: drawer nav and editor sheets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByTestId('projects-page')).toBeVisible();
  await expect(page.getByTestId('app-main')).toBeVisible();
  await expect(page.getByTestId('app-shell-header')).toBeVisible();
  // Persistent desktop sidebar rail is hidden below lg
  await expect(page.getByTestId('app-sidebar')).toBeHidden();

  await page.getByTestId('app-nav-menu').click();
  await expect(page.getByTestId('app-nav-drawer')).toBeVisible();
  await page.getByTestId('app-nav-backdrop').click();
  await expect(page.getByTestId('app-nav-drawer')).toBeHidden();

  await page.getByTestId('projects-create').click();
  await expect(page).toHaveURL(/\/editor\/.+/);
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('editor-open-scene')).toBeVisible();
  await expect(page.getByTestId('editor-open-inspector')).toBeVisible();

  await page.getByTestId('add-shape-cube').click();
  await expect(page.getByTestId('editor-inspector-sheet')).toBeVisible();
  await expect(
    page.getByTestId('editor-inspector-sheet').getByTestId('shape-inspector'),
  ).toBeVisible();
  await expect(page.getByTestId('scene-shape')).toHaveCount(1);
});
