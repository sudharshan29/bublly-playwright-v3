import { test, expect } from '../fixtures/inbox.fixture';

// Serial: each test creates and deletes a real QA conversation via the widget.
// Parallel runs would create a data race — two widget sessions hitting the same inbox
// make the "newest conversation at top" assumption unreliable.
test.describe.configure({ mode: 'serial' });

test.describe('Inbox widget ingestion — TC_INB_WGT_001-002 @smoke', () => {
  // retries: 0 — a retry spawns a second widget message, creating a duplicate conversation in QA.
  // These tests must fail hard so the root cause is investigated, not silently retried.
  test.describe.configure({ retries: 0 });
  test.setTimeout(420_000);

  // Warm up the widget server immediately before these tests run.
  // The server may have gone cold during the ~25 min suite that runs before this group.
  // Uses Playwright's request fixture (ignoreHTTPSErrors: true) because the widget
  // subdomain has a self-signed cert that Node.js fetch() rejects by default.
  // Polls every 10s for up to 3 minutes. beforeAll timeout set to 200s to cover this.
  test.beforeAll(async ({ request }) => {
    const widgetUrl = process.env.HELP_CENTER_URL ?? '';
    if (!widgetUrl) return;
    const deadline = Date.now() + 180_000;
    let attempt = 0;
    while (Date.now() < deadline) {
      attempt++;
      try {
        const res = await request.get(widgetUrl, { timeout: 20_000 });
        console.log(`[widget-warmup] server ready (attempt ${attempt}) — HTTP ${res.status()}`);
        return;
      } catch {
        console.log(`[widget-warmup] not ready yet (attempt ${attempt}) — retrying in 10s`);
        await new Promise(r => setTimeout(r, 10_000));
      }
    }
    console.log('[widget-warmup] timed out after 3 min — proceeding anyway');
  }, { timeout: 200_000 });

  test('TC_INB_WGT_001 widget message creates a routable conversation in the inbox', async ({ page, inboxPage, inboxData }) => {

    const { id } = await inboxData.createOwnedConversation('tc_wgt_001');
    try {
      // Navigate directly to the created conversation — most reliable way to prove it exists
      await inboxPage.gotoConversation(id);
      await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });
      // URL contains the ticket ID — confirms it is a real routable conversation, not a 404
      expect(page.url()).toContain(id);
      expect(page.url()).not.toContain('login');
    } finally {
      // Cleanup: close the conversation so it does not accumulate in Open inbox across runs
      await inboxData.deleteConversation(id);
    }
  });

  test('TC_INB_WGT_002 widget conversation is routed with correct channel and status', async ({ page, inboxPage, inboxData }) => {
    // Widget chat history syncs asynchronously from the widget backend — message text
    // is NOT immediately visible in the agent view for fresh conversations.
    // Instead, verify the two things that ARE immediately available in the Details panel:
    //   • Channel = 'Widget'  — confirms this came from the Help Center widget
    //   • Status  = 'Open'    — confirms it was routed to the agent inbox (not left in bot handling)
    const { id } = await inboxData.createOwnedConversation('tc_wgt_002');
    try {
      await inboxPage.gotoConversation(id);
      await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });
      // Channel field: widget-created conversations always show 'Widget'
      await expect(page.getByText('Widget', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
      // Status field: routed conversations have status 'Open' (set by routing logic)
      const statusRow = page.getByText('Status', { exact: true }).locator('..');
      await expect(statusRow.getByText('Open')).toBeVisible({ timeout: 15_000 });
    } finally {
      await inboxData.deleteConversation(id);
    }
  });

});
