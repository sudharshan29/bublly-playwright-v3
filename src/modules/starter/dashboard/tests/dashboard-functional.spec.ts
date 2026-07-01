import { test, expect } from '../../../../core/fixtures/starter-base.fixture';

test.describe('Starter — Dashboard Functional — TC_ADM_DSH_001–006 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_ADM_DSH_001 dashboard loads and shows all main sections', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    const welcomeHeading = page.getByRole('heading', { level: 1 });
    await expect(welcomeHeading).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /Projects/i }))
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: /Assigned To Me/i }))
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: /Live Feed/i }))
      .toBeVisible({ timeout: 15_000 });
  });

  test('TC_ADM_DSH_002 welcome heading contains username', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 20_000 });
    const text = (await heading.textContent()) ?? '';
    expect(text.toLowerCase()).toContain('welcome');
  });

  test('TC_ADM_DSH_003 top nav shows project dropdown, search trigger, and notification bell', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    await expect(page.locator('#tour-step-search-bar')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#tour-step-notifications')).toBeVisible({ timeout: 10_000 });

    const projectDropdown = page.locator('#tour-step-workspace-switcher');
    await expect(projectDropdown).toBeVisible({ timeout: 10_000 });
  });

  test('TC_ADM_DSH_004 notification bell opens notification panel', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    const bell = page.locator('#tour-step-notifications');
    await bell.waitFor({ state: 'visible', timeout: 15_000 });
    await bell.click();

    const panel = page.getByRole('heading', { name: 'Notification' })
      .or(page.getByText('Notification', { exact: true }).first());
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
  });

  test('TC_ADM_DSH_005 search trigger opens global search modal', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    const searchTrigger = page.locator('#tour-step-search-bar');
    await searchTrigger.waitFor({ state: 'visible', timeout: 15_000 });
    await searchTrigger.click();

    const searchModal = page.getByRole('dialog');
    await expect(searchModal).toBeVisible({ timeout: 10_000 });

    const searchInput = searchModal.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
  });

  test('TC_ADM_DSH_006 project card is visible with Active badge', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /Projects/i }))
      .toBeVisible({ timeout: 15_000 });

    const activeBadge = page.getByText('Active', { exact: true }).first();
    await expect(activeBadge).toBeVisible({ timeout: 15_000 });
  });
});
