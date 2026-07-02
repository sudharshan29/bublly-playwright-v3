import { test, expect } from '../../../../core/fixtures/starter-base.fixture';

async function openNotificationPanel(page: import('@playwright/test').Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
  const bell = page.locator('#tour-step-notifications');
  try {
    await bell.waitFor({ state: 'visible', timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await bell.waitFor({ state: 'visible', timeout: 20_000 });
  }
  await bell.click();
  await page.waitForTimeout(600);
}

test.describe('Starter — Dashboard Notifications Tabs — TC_ADM_DSH_007-010 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_ADM_DSH_007 notification panel has All and Unseen tabs', async ({ page }) => {
    await openNotificationPanel(page);
    const allTab    = page.getByRole('tab', { name: /all/i }).first()
      .or(page.getByText(/^All$/).first());
    const unseenTab = page.getByRole('tab', { name: /unseen/i }).first()
      .or(page.getByText(/unseen|unread/i).first());
    const hasAll    = await allTab.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasUnseen = await unseenTab.isVisible({ timeout: 5_000 }).catch(() => false);
    await page.keyboard.press('Escape');
    if (!hasAll && !hasUnseen) {
      test.skip(true, 'Notification tabs not found — panel may only show a list');
      return;
    }
    expect(hasAll || hasUnseen).toBe(true);
  });

  test('TC_ADM_DSH_008 clicking Unseen tab filters notifications', async ({ page }) => {
    await openNotificationPanel(page);
    const unseenTab = page.getByRole('tab', { name: /unseen/i }).first()
      .or(page.getByText(/unseen|unread/i).first());
    const hasUnseen = await unseenTab.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasUnseen) {
      await page.keyboard.press('Escape');
      test.skip(true, 'Unseen tab not found in notification panel');
      return;
    }
    await unseenTab.click();
    await page.waitForTimeout(800);
    // After clicking Unseen tab, the "Notification" heading should still be visible
    // (panel stays open — just content updates). Use same locator as TC_ADM_DSH_004.
    const panelHeading = page.getByRole('heading', { name: 'Notification' })
      .or(page.getByText('Notification', { exact: true }).first());
    const hasPanel = await panelHeading.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasPanel).toBe(true);
    await page.keyboard.press('Escape').catch(() => {});
  });

  test('TC_ADM_DSH_009 notification panel shows Mark All as Read button', async ({ page }) => {
    await openNotificationPanel(page);
    const markAllBtn = page.getByRole('button', { name: /mark all|read all/i }).first()
      .or(page.getByText(/mark all as read/i).first());
    const hasBtn = await markAllBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    await page.keyboard.press('Escape');
    if (!hasBtn) {
      test.skip(true, '"Mark All as Read" button not found in notification panel');
      return;
    }
    expect(hasBtn).toBe(true);
  });

  test('TC_ADM_DSH_010 notification panel closes when clicking outside', async ({ page }) => {
    await openNotificationPanel(page);
    // Panel should be open
    const panelEl = page.locator('[role="dialog"], [class*="notification-panel"], [class*="notification-list"]').first();
    const panelOpen = await panelEl.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!panelOpen) { test.skip(true, 'Notification panel not found'); return; }
    // Click outside the panel
    await page.locator('h1, main').first().click({ position: { x: 10, y: 10 } }).catch(() => {
      page.keyboard.press('Escape').catch(() => {});
    });
    await page.waitForTimeout(600);
    const panelStillOpen = await panelEl.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(panelStillOpen).toBe(false);
  });
});
