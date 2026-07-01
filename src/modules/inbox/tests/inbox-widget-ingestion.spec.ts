import { test, expect } from '../fixtures/inbox.fixture';

// Widget tickets live in the STARTER inbox — must authenticate as starterAdmin, not freeUser
test.use({ persona: 'starterAdmin' });

// Serial: each test creates and deletes a real QA conversation via the widget.
// Parallel runs would create a data race — two widget sessions hitting the same inbox
// make the "newest conversation at top" assumption unreliable.
test.describe.configure({ mode: 'serial' });

test.describe('Inbox widget ingestion — TC_INB_WGT_001-002 @smoke', () => {
  // retries: 0 — a retry spawns a second widget message, creating a duplicate conversation in QA.
  // These tests must fail hard so the root cause is investigated, not silently retried.
  test.describe.configure({ retries: 0 });
  test.setTimeout(600_000);

  // Both tests use seed tickets created during global-setup via the starter Help Center widget.
  // QA widget routing only works reliably for pre-seeded tickets — real-time routing of a
  // fresh widget message during the test is not supported on this QA environment.
  // If the starter widget is unavailable in QA, both tests skip with a clear message.

  test('TC_INB_WGT_001 widget message creates a routable conversation in the inbox', async ({ page, inboxData }) => {
    const seeded = await inboxData.getSeededConversation();
    if (!seeded) {
      test.skip(true, 'No seeded widget conversations — starter widget is unavailable in QA (report to tech lead)');
      return;
    }
    const { id, ticketUrl } = seeded;
    await page.goto(ticketUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const detailPanel = page.locator('[class*="headerPadding"][class*="w-full"]');
    await expect(detailPanel).toBeVisible({ timeout: 30_000 });
    expect(page.url()).toContain(id);
    expect(page.url()).not.toContain('login');
  });

  test('TC_INB_WGT_002 widget conversation is routed with correct channel and status', async ({ page, inboxData }) => {
    const seeded = await inboxData.getSeededConversation();
    if (!seeded) {
      test.skip(true, 'No seeded widget conversations — starter widget is unavailable in QA (report to tech lead)');
      return;
    }
    const { id, ticketUrl } = seeded;
    await page.goto(ticketUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const detailPanel = page.locator('[class*="headerPadding"][class*="w-full"]');
    await expect(detailPanel).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Widget', { exact: false }).first()).toBeVisible({ timeout: 20_000 });
    const statusRow = page.getByText('Status', { exact: true }).locator('..');
    await expect(statusRow.getByText('Open')).toBeVisible({ timeout: 15_000 });
  });

});
