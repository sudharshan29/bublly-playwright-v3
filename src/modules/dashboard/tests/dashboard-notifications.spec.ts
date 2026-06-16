import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard notifications panel — TC_DSH_028–033 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_028 notification bell icon is visible in the top navigation bar', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.notificationBell).toBeVisible({ timeout: 15_000 });
  });

  test('TC_DSH_029 clicking the bell opens the notification slide-out panel', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await expect(dashboardPage.loc.notificationPanelTitle).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeNotificationPanel();
  });

  test('TC_DSH_030 notification panel shows All and Unseen tabs', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await expect(dashboardPage.loc.notifTabAll).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.notifTabUnseen).toBeVisible({ timeout: 5_000 });
    await dashboardPage.closeNotificationPanel();
  });

  test('TC_DSH_031 clicking Unseen tab stays on the notification panel', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await dashboardPage.loc.notifTabUnseen.click();
    await page.waitForTimeout(500);
    // Panel should still be open (not closed by tab click)
    await expect(dashboardPage.loc.notificationPanelTitle).toBeVisible({ timeout: 5_000 });
    // Switching back to All tab
    await dashboardPage.loc.notifTabAll.click();
    await page.waitForTimeout(300);
    await dashboardPage.closeNotificationPanel();
  });

  test('TC_DSH_032 notification panel shows content — empty state or notification list', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    // Either "No unread notifications" text (empty panel) …
    const hasEmpty = await dashboardPage.loc.notifEmptyState.isVisible({ timeout: 5_000 }).catch(() => false);
    // … or "Mark as all read" button (only present when the panel has unread items)
    // Notification items are generic divs, not role="listitem"
    const hasItems = await page.getByRole('button', { name: 'Mark as all read' }).isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasEmpty || hasItems).toBe(true);
    await dashboardPage.closeNotificationPanel();
  });

  test('TC_DSH_033 close icon button collapses the notification panel', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    await expect(dashboardPage.loc.notificationPanelTitle).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeNotificationPanel();
    await expect(dashboardPage.loc.notificationPanelTitle).not.toBeVisible({ timeout: 10_000 });
  });
});
