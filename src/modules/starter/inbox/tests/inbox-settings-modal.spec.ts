import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox — Settings Panel — TC_IST_001–006 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ inboxSettingsPage }) => {
    await inboxSettingsPage.gotoInbox();
  });

  test('TC_IST_001 Inbox Settings link is visible in sidebar', async ({ inboxSettingsPage }) => {
    await expect(inboxSettingsPage.loc.settingsLink).toBeVisible();
  });

  test('TC_IST_002 clicking Inbox Settings opens the settings panel', async ({ inboxSettingsPage, page }) => {
    const urlBefore = page.url();
    await inboxSettingsPage.openModal();
    expect(page.url()).toBe(urlBefore);
    await expect(inboxSettingsPage.loc.panel).toBeVisible();
  });

  test('TC_IST_003 URL does not change when settings panel opens', async ({ inboxSettingsPage, page }) => {
    const urlBefore = page.url();
    await inboxSettingsPage.openModal();
    expect(page.url()).toBe(urlBefore);
  });

  test('TC_IST_004 settings panel has a Close dialog button', async ({ inboxSettingsPage }) => {
    await inboxSettingsPage.openModal();
    await expect(inboxSettingsPage.loc.closeBtn).toBeVisible();
  });

  test('TC_IST_005 clicking Close dialog dismisses the panel', async ({ inboxSettingsPage }) => {
    await inboxSettingsPage.openModal();
    await inboxSettingsPage.closeModal();
    await expect(inboxSettingsPage.loc.panel).not.toBeVisible();
  });

  test('TC_IST_006 Escape key closes the settings panel', async ({ inboxSettingsPage, page }) => {
    await inboxSettingsPage.openModal();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(inboxSettingsPage.loc.panel).not.toBeVisible();
  });
});
