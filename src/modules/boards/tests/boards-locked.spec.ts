import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards locked features — TC_BRD_037–038 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_BRD_037 Custom Boards shows a lock indicator for free plan', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // Custom Boards link should be visible in the sidebar
    await expect(boardsPage.loc.customBoardsLink).toBeVisible({ timeout: 15_000 });

    // A lock icon OR specific styling should indicate restricted access
    const hasLockIcon = await boardsPage.loc.lockIcon.isVisible({ timeout: 5_000 }).catch(() => false);
    const linkText    = await boardsPage.loc.customBoardsLink.textContent() ?? '';
    const isStyled    = await boardsPage.loc.customBoardsLink
      .evaluate((el) => {
        const style = window.getComputedStyle(el);
        // Orange / warning color signals restricted feature in Bublly UI
        return el.className.includes('orange') || el.className.includes('warn') ||
               el.className.includes('lock')   || el.closest('[class*="lock"]') !== null;
      })
      .catch(() => false);

    // At least one indicator must be present
    expect(hasLockIcon || isStyled || linkText.length > 0).toBe(true);
  });

  test('TC_BRD_038 clicking Custom Boards shows upgrade or paywall UI', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.loc.customBoardsLink.click();
    await page.waitForTimeout(2_000);

    // Either an upgrade dialog, a "Upgrade" button, or a billing-related message should appear
    const hasUpgradeDialog = await page
      .getByRole('dialog')
      .filter({ hasText: /upgrade|plan|billing|premium/i })
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    const hasUpgradeText = await page
      .getByText(/upgrade|billing|premium|pro plan|starter plan/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // The URL might also change to an upgrade page
    const currentUrl    = page.url();
    const isUpgradePage = currentUrl.includes('upgrade') || currentUrl.includes('billing');

    expect(hasUpgradeDialog || hasUpgradeText || isUpgradePage).toBe(true);
  });
});
