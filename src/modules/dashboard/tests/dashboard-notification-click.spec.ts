import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard notification item click — TC_DSH_046 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_DSH_046 clicking a notification item navigates to the relevant conversation', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await page.waitForTimeout(1_000);

    const itemCount = await dashboardPage.loc.notificationItems.count();

    if (itemCount === 0) {
      // No notifications in QA data for this account — verify empty state is shown
      const emptyVisible = await dashboardPage.loc.notifEmptyState.isVisible({ timeout: 5_000 }).catch(() => false);
      const markReadVisible = await dashboardPage.loc.markAllReadBtn.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(emptyVisible || markReadVisible).toBe(true);
      await dashboardPage.closeNotificationPanel();
      test.skip();
      return;
    }

    const urlBefore = page.url();
    await dashboardPage.loc.notificationItems.first().click();
    await page.waitForTimeout(2_000);

    // Clicking a notification must navigate away from the dashboard (to a ticket/conversation)
    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    // Should land on an inbox or project page — not a login/404 page
    expect(urlAfter).not.toContain('login');
    expect(await page.locator('body').innerText()).not.toContain('404');
  });

  test('TC_DSH_047 Mark as all read button clears unread notifications', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await page.waitForTimeout(1_000);

    const markReadVisible = await dashboardPage.loc.markAllReadBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!markReadVisible) {
      // No unread notifications — skip
      await dashboardPage.closeNotificationPanel();
      test.skip();
      return;
    }

    await dashboardPage.loc.markAllReadBtn.click();
    await page.waitForTimeout(1_500);

    // After marking all read, the button should disappear or the empty state appears
    const stillVisible = await dashboardPage.loc.markAllReadBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const emptyVisible = await dashboardPage.loc.notifEmptyState.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(!stillVisible || emptyVisible).toBe(true);

    await dashboardPage.closeNotificationPanel();
  });
});
