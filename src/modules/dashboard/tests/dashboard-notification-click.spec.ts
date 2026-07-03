import { test, expect } from '../fixtures/dashboard.fixture';
import { env } from '../../../../config/environment';
import type { Browser, Page } from '@playwright/test';
import type { DashboardPage } from '../pages/dashboard.page';

// ── Live-investigation findings (root cause of the original skips) ─────────
//
// The notification bell panel had ZERO unread notifications in QA data for
// the free-plan account — this was confirmed by directly inspecting the
// GET /users/getNotifications/10/0 response: every stored notification
// already had isRead:true. The panel opens on its "Unseen" tab by default,
// so with no unread items it always rendered the empty state — this is a
// genuine QA data gap, not a locator bug.
//
// Also confirmed live: an agent creating a brand-new conversation from the
// Inbox (the same flow TC_E2E_006 uses) does NOT generate a notification for
// that same agent — the "create ticket" notification is only produced by a
// genuine CUSTOMER-initiated message sent through the public Help Center
// widget. So, mirroring the e2e-006 "New Conversation → Dashboard Live Feed"
// pattern of creating real activity right before assertions, each test below
// sends one real widget message to manufacture a fresh unread notification
// before touching the panel.

/**
 * Sends a real customer message through the free-plan Help Center widget.
 * This reliably produces one unread "create ticket" notification for the
 * free-plan agent account (confirmed via live testing — server-side indexing
 * takes a few seconds, hence the retry/poll in waitForNotificationItem).
 */
async function createUnreadWidgetNotification(browser: Browser, tag: string): Promise<void> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const widgetPage = await ctx.newPage();
  try {
    await widgetPage.goto(env.helpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await widgetPage.locator('#bublly-widget').waitFor({ state: 'attached', timeout: 30_000 });
    const frame = widgetPage.frameLocator('#bublly-widget');

    const startChatBtn = frame.getByRole('button', { name: /start chat/i });
    await startChatBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await startChatBtn.click();

    const askQuestion = frame.getByText(/ask a question/i);
    await askQuestion.first().waitFor({ state: 'visible', timeout: 15_000 });
    await askQuestion.first().click();

    const chatInput = frame.getByRole('textbox', { name: 'Message input' });
    const sendBtn   = frame.getByRole('button', { name: 'Send message' });

    // Slate.js editor starts as contenteditable="false" until the bot greeting
    // finishes loading — poll until it becomes editable (same technique used
    // in scripts/seed-starter-inbox.ts).
    const waitEditable = async () => {
      await chatInput.waitFor({ state: 'visible', timeout: 15_000 });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if ((await chatInput.getAttribute('contenteditable')) === 'true') return;
        await widgetPage.waitForTimeout(500);
      }
    };
    const typeAndSend = async (text: string) => {
      await waitEditable();
      await chatInput.click();
      await chatInput.pressSequentially(text, { delay: 30 });
      await sendBtn.click();
      await widgetPage.waitForTimeout(1_500);
    };

    // Flow: question → visitor email → confirm.
    await typeAndSend(`TC_DSH_046_047 notif seed ${tag}`);
    await typeAndSend(`qa.dsh-notif.${tag}@mailinator.com`);
    await typeAndSend('yes');
    await widgetPage.waitForTimeout(3_000);
  } finally {
    await ctx.close();
  }
}

/**
 * Opens (or re-opens) the notification panel and retries via full page
 * reloads until at least one notification item appears. A freshly created
 * widget ticket is not always indexed in time for the very first fetch —
 * confirmed live: the first GET /users/getNotifications right after sending
 * a widget message can still return the old/empty list.
 */
async function waitForNotificationItem(
  dashboardPage: DashboardPage,
  page: Page,
  timeoutMs = 60_000,
): Promise<number> {
  let count = await dashboardPage.loc.notificationItems.count();
  const deadline = Date.now() + timeoutMs;
  while (count === 0 && Date.now() < deadline) {
    await page.waitForTimeout(3_000);
    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    count = await dashboardPage.loc.notificationItems.count();
  }
  return count;
}

test.describe('Dashboard notification item click — TC_DSH_046 @smoke', () => {
  test.setTimeout(150_000);
  // Each test sends one real widget message to create fresh QA data. A retry
  // would send a second message, creating a duplicate conversation — these
  // must fail hard so a genuine problem gets investigated, not silently retried.
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('TC_DSH_046 clicking a notification item navigates to the relevant conversation', async ({ dashboardPage, page, browser }) => {
    await createUnreadWidgetNotification(browser, `046-${Date.now()}`);

    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    const itemCount = await waitForNotificationItem(dashboardPage, page);
    expect(itemCount, 'expected at least one unread notification after seeding a fresh widget conversation').toBeGreaterThan(0);

    const urlBefore = page.url();
    const notificationItems = dashboardPage.loc.notificationItems;
    await notificationItems.first().click();
    await page.waitForTimeout(2_000);

    // Clicking a notification must navigate away from the dashboard (to a ticket/conversation)
    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    // Should land on an inbox or project page — not a login/404 page
    expect(urlAfter).not.toContain('login');
    expect(await page.locator('body').innerText()).not.toContain('404');
  });

  test('TC_DSH_047 Mark as all read button clears unread notifications', async ({ dashboardPage, page, browser }) => {
    await createUnreadWidgetNotification(browser, `047-${Date.now()}`);

    await dashboardPage.goto();
    await dashboardPage.openNotificationPanel();
    const itemCount = await waitForNotificationItem(dashboardPage, page);
    expect(itemCount, 'expected at least one unread notification after seeding a fresh widget conversation').toBeGreaterThan(0);

    const markReadVisible = await dashboardPage.loc.markAllReadBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(markReadVisible, '"Mark as all read" button should be visible when unread notifications exist').toBe(true);

    await dashboardPage.loc.markAllReadBtn.click();
    await page.waitForTimeout(1_500);

    // After marking all read, the button should disappear or the empty state appears
    const stillVisible = await dashboardPage.loc.markAllReadBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const emptyVisible = await dashboardPage.loc.notifEmptyState.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(!stillVisible || emptyVisible).toBe(true);

    await dashboardPage.closeNotificationPanel();
  });
});
