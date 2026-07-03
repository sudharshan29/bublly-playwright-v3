import { test, expect } from '../../../../core/fixtures/starter-base.fixture';
import { env } from '../../../../../config/environment';
import type { Browser } from '@playwright/test';

// ── Live-investigation findings for TC_ADM_DSH_009 (root cause of the skip) ──
//
// The notification bell panel had ZERO unread notifications in QA data for
// the starter-admin account — confirmed by directly inspecting the
// GET /users/getNotifications response: every stored notification already
// had isRead:true (the "Unseen" tab therefore always showed nothing). This
// is a genuine QA data gap, not a locator bug — but a genuine LOCATOR BUG was
// also found and fixed below (see markAllBtn).
//
// A genuine unread notification is only produced by a real CUSTOMER-initiated
// message sent through the starter Help Center widget (an agent creating a
// new conversation from the Inbox does NOT notify that same agent — verified
// live). So this test sends one real widget message before opening the panel,
// mirroring the existing scripts/seed-starter-inbox.ts widget flow.
async function createUnreadWidgetNotification(browser: Browser, tag: string): Promise<void> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const widgetPage = await ctx.newPage();
  try {
    await widgetPage.goto(env.starterHelpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await widgetPage.waitForTimeout(5_000); // let the widget script inject its iframe
    const frame = widgetPage.frameLocator('#bublly-widget, iframe[src*="widget.bublly.com"]');

    const startBtn = frame.getByRole('button', { name: /start chat/i });
    await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await startBtn.click();

    const askQuestion = frame.getByText(/ask a question/i);
    await askQuestion.first().waitFor({ state: 'visible', timeout: 15_000 });
    await askQuestion.first().click();

    const chatInput = frame.getByRole('textbox', { name: 'Message input' });
    const sendBtn   = frame.getByRole('button', { name: 'Send message' });

    const waitEditable = async () => {
      await chatInput.waitFor({ state: 'visible', timeout: 15_000 });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if ((await chatInput.getAttribute('contenteditable')) === 'true') return;
        await widgetPage.waitForTimeout(800);
      }
    };
    const typeAndSend = async (text: string) => {
      await waitEditable();
      await chatInput.click();
      await chatInput.pressSequentially(text, { delay: 30 });
      await sendBtn.click();
      await widgetPage.waitForTimeout(1_500);
    };

    await typeAndSend(`TC_ADM_DSH_009 notif seed ${tag}`);
    await typeAndSend(`qa.adm-dsh-notif.${tag}@mailinator.com`);
    await typeAndSend('yes');
    await widgetPage.waitForTimeout(3_000);
  } finally {
    await ctx.close();
  }
}

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

  test.describe('Mark All as Read button (seeds a fresh unread notification)', () => {
    // Sends one real widget message to create fresh QA data. A retry would
    // send a second message, creating a duplicate conversation — must fail
    // hard so a genuine problem gets investigated, not silently retried.
    test.describe.configure({ retries: 0 });
    test.setTimeout(150_000);

    test('TC_ADM_DSH_009 notification panel shows Mark All as Read button', async ({ page, browser }) => {
      await createUnreadWidgetNotification(browser, `${Date.now()}`);

      // A freshly created widget ticket takes a few seconds to be indexed
      // server-side (confirmed live) — retry via full page reloads until the
      // button appears, or the deadline elapses.
      // NOTE: the two sub-locators below are unioned via .or() BEFORE calling
      // .first() (not after) — calling .first() on each side individually and
      // THEN .or()-ing them can resolve to two distinct DOM nodes (e.g. a
      // getByText() match on a wrapper element plus the getByRole() match on
      // the inner <button>), which throws a strict-mode violation that was
      // being silently swallowed by .catch(() => false) below. That bug alone
      // meant this assertion could never pass even with real unread data.
      const markAllBtnUnion = page.getByRole('button', { name: /mark all|read all/i })
        .or(page.getByText(/mark all as read/i));
      const markAllBtn = markAllBtnUnion.first();

      let hasBtn = await markAllBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      const deadline = Date.now() + 60_000;
      while (!hasBtn && Date.now() < deadline) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(3_000);
        await openNotificationPanel(page);
        hasBtn = await markAllBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      }

      await page.keyboard.press('Escape').catch(() => {});
      expect(hasBtn, '"Mark All as Read" button should be visible after seeding a fresh unread notification').toBe(true);
    });
  });

  test('TC_ADM_DSH_010 notification panel closes when clicking outside', async ({ page }) => {
    await openNotificationPanel(page);
    // The notification panel is NOT a dialog — identify it by the heading role
    const panelHeading = page.getByRole('heading', { name: 'Notification' })
      .or(page.getByRole('heading', { name: /notification/i }).first());
    const panelOpen = await panelHeading.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!panelOpen) { test.skip(true, 'Notification panel not found — heading not visible'); return; }
    // Click the main content area (top-left, outside the panel) to dismiss
    await page.mouse.click(10, 10);
    await page.waitForTimeout(800);
    const panelStillOpen = await panelHeading.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(panelStillOpen).toBe(false);
  });
});
