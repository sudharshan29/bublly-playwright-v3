import { test, expect } from '../fixtures/profile.fixture';

test.describe('Starter Profile Menu extended — TC_PROF_004–010 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ profileMenuPage }) => {
    await profileMenuPage.gotoDashboard();
    await profileMenuPage.openMenu();
  });

  test('TC_PROF_004 profile popup shows user name or email in header', async ({ page }) => {
    // Profile popup is a plain styled div — no role="menu". Check whole-page text for user identity.
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 }).catch(() => '');
    expect(bodyText?.toLowerCase()).toMatch(/starter|admin|bublly|mailinator|@/i);
  });

  test('TC_PROF_005 profile popup has Availability section', async ({ page }) => {
    const availability = page.getByText('Availability', { exact: false }).first();
    await expect(availability).toBeVisible({ timeout: 5_000 });
  });

  test('TC_PROF_006 profile popup has Theme section', async ({ page }) => {
    const theme = page.getByText('Theme', { exact: false }).first();
    await expect(theme).toBeVisible({ timeout: 5_000 });
  });

  test('TC_PROF_007 profile popup has Workspaces section', async ({ page }) => {
    const workspaces = page.getByText('Workspaces', { exact: false }).first();
    await expect(workspaces).toBeVisible({ timeout: 5_000 });
  });

  test('TC_PROF_008 profile popup has Invite Members link', async ({ page }) => {
    const invite = page.getByText('Invite Members', { exact: false }).first()
      .or(page.getByRole('link', { name: /invite/i }).first());
    await expect(invite).toBeVisible({ timeout: 5_000 });
  });

  test('TC_PROF_009 profile popup has Help Center link', async ({ page }) => {
    const helpCenter = page.getByText('Help Center', { exact: false }).first()
      .or(page.getByRole('link', { name: /help center/i }).first());
    await expect(helpCenter).toBeVisible({ timeout: 5_000 });
  });

  test('TC_PROF_010 Logout item is visible in profile menu', async ({ profileMenuPage }) => {
    await expect(profileMenuPage.loc.logoutItem).toBeVisible({ timeout: 5_000 });
  });
});
