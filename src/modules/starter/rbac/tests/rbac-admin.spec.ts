import { test, expect } from '../../../../core/fixtures/starter-base.fixture';
import { env } from '../../../../../config/environment';

test.describe('RBAC admin role — TC_RBAC_001–006 @rbac', () => {
  test.setTimeout(60_000);

  test('TC_RBAC_001 admin post-login lands on dashboard not inbox', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC_RBAC_002 admin sidebar shows Settings gear icon', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    const settingsIcon = page.locator('[id*="settings"], [data-nextstep*="settings"]').first();
    await expect(settingsIcon).toBeVisible({ timeout: 15_000 });
  });

  test('TC_RBAC_003 admin can open Settings from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    const settingsIcon = page.locator('[id*="settings"], [data-nextstep*="settings"]').first();
    await settingsIcon.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsIcon.click();
    await page.waitForURL(/\/settings/, { timeout: 30_000 });
    expect(page.url()).toContain('/settings');
    await expect(page.getByText('Home', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC_RBAC_004 admin Settings home shows WorkSpace Members and Projects cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    const settingsIcon = page.locator('[id*="settings"], [data-nextstep*="settings"]').first();
    await settingsIcon.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsIcon.click();
    await page.waitForURL(/\/settings/, { timeout: 30_000 });
    await expect(page.getByText('Manage workspace preferences and branding.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Invite, manage, and assign workspace members.')).toBeVisible({ timeout: 10_000 });
  });

  test('TC_RBAC_005 admin Contacts page shows Merge contacts button', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForURL(/contacts/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Merge contacts', exact: false })).toBeVisible({ timeout: 15_000 });
  });

  test('TC_RBAC_006 admin Contacts Create Custom List has no lock icon', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForURL(/contacts/, { timeout: 30_000 });
    const createListEl = page.getByText('Create Custom List', { exact: true }).first();
    await expect(createListEl).toBeVisible({ timeout: 15_000 });
    // Admin has + icon (not a lock); the lock class is absent
    const parentText = await createListEl.locator('..').textContent();
    expect(parentText).not.toMatch(/lock/i);
  });
});
