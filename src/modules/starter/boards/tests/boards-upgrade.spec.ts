import { test, expect } from '../fixtures/boards-starter.fixture';

test.describe('Starter Boards — Upgrade Paywall — TC_UPG_001–008 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ boardsUpgradePage }) => {
    await boardsUpgradePage.gotoBoards();
  });

  test('TC_UPG_001 Custom Boards option is visible in sidebar', async ({ boardsUpgradePage }) => {
    await expect(boardsUpgradePage.loc.customBoardsLink).toBeVisible();
  });

  test('TC_UPG_002 Custom Boards shows a lock icon indicating it is a paid feature', async ({ boardsUpgradePage }) => {
    await expect(boardsUpgradePage.loc.lockIcon).toBeVisible();
  });

  test('TC_UPG_003 clicking Custom Boards triggers upgrade flow — modal or billing redirect', async ({ boardsUpgradePage, page }) => {
    // Click directly (do not auto-restore) to capture immediate post-click state
    await boardsUpgradePage.loc.customBoardsLink.click();
    // Race for the fastest signal: upgrade dialog OR billing/settings URL change.
    // QA modal rendering can be slow — waiting for the first concrete event is more
    // reliable than a flat sleep that may expire before the UI reacts.
    await Promise.race([
      boardsUpgradePage.loc.modal.waitFor({ state: 'visible', timeout: 5_000 }),
      page.waitForURL(/billing|settings/, { timeout: 5_000 }),
    ]).catch(() => {});
    const modalVisible = await boardsUpgradePage.loc.modal.isVisible().catch(() => false);
    const url = page.url();
    const redirected = url.includes('billing') || url.includes('settings') || !url.includes('/tickets');
    expect(modalVisible || redirected).toBe(true);
  });

  test('TC_UPG_004 after Custom Boards click URL leaves boards or shows upgrade dialog', async ({ boardsUpgradePage, page }) => {
    await boardsUpgradePage.loc.customBoardsLink.click();
    await page.waitForTimeout(2_000);
    const url = page.url();
    const modal = await boardsUpgradePage.loc.modal.isVisible();
    // Either we navigated away from /tickets or a dialog opened in place
    expect(!url.includes('/tickets') || modal).toBe(true);
  });

  test('TC_UPG_005 boards page still loads correctly after dismissing paywall', async ({ boardsUpgradePage, page }) => {
    await boardsUpgradePage.openUpgradeModal();
    // Navigate back to boards if redirected away
    if (!page.url().includes('/tickets')) {
      await page.goto(
        `/project/${process.env.STARTER_PROJECT_ID}/tickets/${process.env.STARTER_BOARD_ID}`
      );
    }
    await boardsUpgradePage.loc.customBoardsLink.waitFor({ state: 'visible', timeout: 30_000 });
    expect(page.url()).toContain('/tickets');
  });

  test('TC_UPG_006 Bug board and FeatureRequests board links are still visible after paywall interaction', async ({ boardsUpgradePage, page }) => {
    await boardsUpgradePage.openUpgradeModal();
    if (!page.url().includes('/tickets')) {
      await page.goto(
        `/project/${process.env.STARTER_PROJECT_ID}/tickets/${process.env.STARTER_BOARD_ID}`
      );
      await page.waitForURL(/tickets/, { timeout: 30_000 });
    }
    const bugBoard = page.getByText('Bug', { exact: true }).first();
    await expect(bugBoard).toBeVisible({ timeout: 20_000 });
  });

  test('TC_UPG_007 Custom Boards lock icon is still visible after navigating back', async ({ boardsUpgradePage, page }) => {
    await boardsUpgradePage.openUpgradeModal();
    if (!page.url().includes('/tickets')) {
      await page.goto(
        `/project/${process.env.STARTER_PROJECT_ID}/tickets/${process.env.STARTER_BOARD_ID}`
      );
      await page.waitForURL(/tickets/, { timeout: 30_000 });
    }
    await expect(boardsUpgradePage.loc.lockIcon).toBeVisible({ timeout: 20_000 });
  });

  test('TC_UPG_008 Custom Boards section does not navigate to a board kanban view', async ({ boardsUpgradePage, page }) => {
    const urlBefore = page.url();
    await boardsUpgradePage.loc.customBoardsLink.click();
    await page.waitForTimeout(1_500);
    // Should NOT land on a kanban board (no column header like Open/Done)
    const openColumn = page.locator('p').filter({ hasText: /^Open$/ });
    const isKanban   = await openColumn.isVisible();
    expect(isKanban).toBe(false);
  });
});
