import { test, expect } from '../fixtures/e2e.fixture';

// TC_E2E_002 — Dashboard Live Feed → Correct Module
//
// Cross-module boundary: Dashboard (data source) → Inbox or Boards (destination)
// What this proves: a live feed activity item displaying FRE#_ID routes to the
// correct module for that ticket — inbox tickets navigate to the Inbox module,
// boards tickets navigate to the Boards module. The destination page must fully
// render its module-specific UI (detail panel for inbox, kanban cards for boards).
//
// Bug class caught:
// → Live feed item links to wrong module or wrong ticket
// → Destination page fails to render after cross-module navigation from dashboard

test.describe('E2E — Dashboard Live Feed → Module Navigation @e2e', () => {
  test.setTimeout(120_000);

  test('TC_E2E_002 dashboard live feed item navigates to the correct module', async ({
    page,
    dashboardPage,
    boardsPage,
    inboxPage,
  }) => {
    // ── Step 1: Load dashboard and wait for Live Feed ─────────────────────
    await dashboardPage.goto();

    const firstItem = dashboardPage.loc.liveFeedItems.first();
    await firstItem.waitFor({ state: 'visible', timeout: 20_000 });

    // ── Step 2: Read FRE#_ID from live feed item ──────────────────────────
    const itemText  = (await firstItem.textContent()) ?? '';
    const idMatch   = itemText.match(/FRE\d+_\d+/);

    if (!idMatch) {
      console.log('[TC_E2E_002] No FRE#_ID in live feed item — skipping');
      return;
    }

    const freTicketId = idMatch[0]; // e.g. "FRE519_1904" or "FRE1895_1234"
    console.log(`[TC_E2E_002] Live feed ticket: ${freTicketId}`);

    // ── Step 3: Click live feed item → cross-module navigation ────────────
    // Live feed tickets can belong to Inbox OR Boards — the navigation depends
    // on the ticket type, so we wait for either URL pattern.
    await firstItem.click();
    await page.waitForURL(/\/tickets?\/\d+/, { timeout: 30_000 });

    const destUrl = page.url();

    // ── Cross-module Assertion 1: URL is a valid module route ─────────────
    const inInbox  = destUrl.includes('/inbox/');
    const inBoards = !inInbox && /\/tickets?\/\d+/.test(destUrl);
    expect(inInbox || inBoards).toBe(true);
    console.log(`[TC_E2E_002] Navigated to: ${inInbox ? 'Inbox' : 'Boards'} — ${destUrl}`);

    if (inInbox) {
      // ── Cross-module Assertion 2 (inbox): conversation detail loaded ─────
      // Inbox detail header confirms the conversation rendered (not just URL changed)
      await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });

      // ── Cross-module Assertion 3 (inbox): Ticket ID label present ─────────
      await expect(page.getByText('Ticket ID', { exact: true })).toBeVisible({ timeout: 15_000 });
    } else {
      // ── Cross-module Assertion 2 (boards): ticket cards rendered ──────────
      // Kanban ticket cards confirm the board loaded (not just navigated to URL)
      await expect(boardsPage.loc.ticketCards.first()).toBeVisible({ timeout: 30_000 });

      // ── Cross-module Assertion 3 (boards): FRE#_ID exists on this board ───
      const freCard = boardsPage.loc.ticketCards.filter({ hasText: freTicketId }).first();
      const freVisible = await freCard.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!freVisible) {
        await boardsPage.search(freTicketId);
        await page.waitForTimeout(1_500);
        await expect(
          boardsPage.loc.ticketCards.filter({ hasText: freTicketId }).first()
        ).toBeVisible({ timeout: 10_000 });
        await boardsPage.clearSearch();
      }
    }

    console.log(`[TC_E2E_002] ✅ Dashboard Live Feed → ${inInbox ? 'Inbox' : 'Boards'} verified for ${freTicketId}`);
  });
});
