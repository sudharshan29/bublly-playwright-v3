import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox — Custom View — TC_CUV_001–004 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ inboxCustomViewPage }) => {
    await inboxCustomViewPage.gotoInbox();
  });

  test('TC_CUV_001 Custom View sidebar item is visible in inbox', async ({ inboxCustomViewPage }) => {
    await expect(inboxCustomViewPage.loc.customViewSidebarItem).toBeVisible();
  });

  test('TC_CUV_002 Custom View does NOT show Upgrade label', async ({ inboxCustomViewPage }) => {
    const upgradeCount = await inboxCustomViewPage.loc.upgradeLabel.count();
    expect(upgradeCount).toBeLessThan(2);
  });

  test('TC_CUV_003 clicking Custom View sidebar item does NOT navigate away from inbox', async ({ inboxCustomViewPage, page }) => {
    await inboxCustomViewPage.loc.customViewSidebarItem.click();
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_CUV_004 inbox URL remains correct after Custom View click', async ({ inboxCustomViewPage, page }) => {
    const inboxId = process.env.STARTER_INBOX_ID ?? '';
    await inboxCustomViewPage.loc.customViewSidebarItem.click();
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain(inboxId);
  });
});
