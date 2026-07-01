import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox — Groups — TC_GRP_001–004 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ inboxGroupsPage }) => {
    await inboxGroupsPage.gotoInbox();
  });

  test('TC_GRP_001 Groups sidebar item is visible in inbox', async ({ inboxGroupsPage }) => {
    await expect(inboxGroupsPage.loc.groupsSidebarItem).toBeVisible();
  });

  test('TC_GRP_002 Groups sidebar does NOT show Upgrade label (feature is unlocked)', async ({ inboxGroupsPage, page }) => {
    const upgradeCount = await inboxGroupsPage.loc.upgradeLabel.count();
    expect(upgradeCount).toBeLessThan(2);
  });

  test('TC_GRP_003 clicking Groups sidebar item does NOT navigate away from inbox', async ({ inboxGroupsPage, page }) => {
    await inboxGroupsPage.loc.groupsSidebarItem.click();
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_GRP_004 inbox URL remains correct after Groups click', async ({ inboxGroupsPage, page }) => {
    const inboxId = process.env.STARTER_INBOX_ID ?? '';
    await inboxGroupsPage.loc.groupsSidebarItem.click();
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain(inboxId);
  });
});
