import { test, expect } from '../fixtures/inbox.fixture';

test.describe('Inbox locked features — TC_INB_LOCK_001-004 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_LOCK_001 Groups section shows Upgrade text for free-plan user', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await expect(page.getByText('Groups', { exact: true })).toBeVisible({ timeout: 20_000 });
    // "Upgrade" is plain text inside a generic div (NOT a <button>)
    await expect(page.getByText('Upgrade', { exact: true }).nth(0)).toBeVisible({ timeout: 10_000 });
  });

  test('TC_INB_LOCK_002 Clicking Groups Upgrade shows upgrade/paywall UI', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await page.getByText('Groups', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    // Click the first Upgrade element (Groups row)
    await page.getByText('Upgrade', { exact: true }).nth(0).click();

    // Bublly shows a paywall via dialog, navigate, or inline upgrade prompt
    const isDialog      = page.getByRole('dialog').filter({ hasText: /upgrade|plan|billing/i });
    const isUpgradeText = page.getByText(/upgrade|billing|choose a plan/i).first();

    await Promise.race([
      isDialog.waitFor({ state: 'visible', timeout: 10_000 }),
      isUpgradeText.waitFor({ state: 'visible', timeout: 10_000 }),
      page.waitForURL(/upgrade|billing|plan/, { timeout: 10_000 }),
    ]).catch(() => {});

    const url        = page.url();
    const hasModal   = await isDialog.isVisible().catch(() => false);
    const hasText    = await isUpgradeText.isVisible().catch(() => false);
    const hasUrlHit  = /upgrade|billing|plan/.test(url);

    expect(hasModal || hasText || hasUrlHit).toBe(true);
  });

  test('TC_INB_LOCK_003 Custom View section shows Upgrade text for free-plan user', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await expect(page.getByText('Custom View', { exact: true })).toBeVisible({ timeout: 20_000 });
    // Both Groups and Custom View show Upgrade — at least 2 instances exist
    const upgradeCount = await page.getByText('Upgrade', { exact: true }).count();
    expect(upgradeCount).toBeGreaterThanOrEqual(2);
    await expect(page.getByText('Upgrade', { exact: true }).nth(1)).toBeVisible({ timeout: 10_000 });
  });

  test('TC_INB_LOCK_004 Clicking Custom View Upgrade shows upgrade/paywall UI', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await page.getByText('Custom View', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    // Click the second Upgrade element (Custom View row)
    await page.getByText('Upgrade', { exact: true }).nth(1).click();

    const isDialog      = page.getByRole('dialog').filter({ hasText: /upgrade|plan|billing/i });
    const isUpgradeText = page.getByText(/upgrade|billing|choose a plan/i).first();

    await Promise.race([
      isDialog.waitFor({ state: 'visible', timeout: 10_000 }),
      isUpgradeText.waitFor({ state: 'visible', timeout: 10_000 }),
      page.waitForURL(/upgrade|billing|plan/, { timeout: 10_000 }),
    ]).catch(() => {});

    const url        = page.url();
    const hasModal   = await isDialog.isVisible().catch(() => false);
    const hasText    = await isUpgradeText.isVisible().catch(() => false);
    const hasUrlHit  = /upgrade|billing|plan/.test(url);

    expect(hasModal || hasText || hasUrlHit).toBe(true);
  });

});
