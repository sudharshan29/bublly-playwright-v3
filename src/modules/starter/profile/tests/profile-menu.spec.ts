import { test, expect } from '../fixtures/profile.fixture';

test.describe('Starter Profile Menu — TC_PRO_001–003 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ profileMenuPage }) => {
    await profileMenuPage.gotoDashboard();
  });

  test('TC_PRO_001 avatar is visible in sidebar for starter admin', async ({ profileMenuPage }) => {
    await expect(profileMenuPage.loc.avatar).toBeVisible();
  });

  test('TC_PRO_002 clicking avatar opens dropdown with Logout option', async ({ profileMenuPage }) => {
    await profileMenuPage.openMenu();
    await expect(profileMenuPage.loc.logoutItem).toBeVisible();
  });

  test('TC_PRO_003 Logout item text is exactly "Logout"', async ({ profileMenuPage }) => {
    await profileMenuPage.openMenu();
    const text = (await profileMenuPage.loc.logoutItem.textContent()) ?? '';
    expect(text.trim()).toBe('Logout');
  });
});
