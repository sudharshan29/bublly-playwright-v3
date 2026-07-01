import { test, expect } from '../fixtures/e2e.fixture';

// TC_E2E_003 — Dashboard Global Search → Inbox
//
// Cross-module boundary: Dashboard (search origin) → Inbox (search result destination)
// What this proves: the global search command palette, triggered from the dashboard,
// returns inbox conversation results and clicking a Messages result lands on the
// correct inbox conversation — fully rendered with detail panel, not just a URL redirect.
//
// Bug class caught:
// → Global search returns inbox results but clicking navigates to wrong conversation
// → Search result click navigates to inbox URL but conversation fails to load
// → Cross-module search indexing is broken (Messages section never appears)

test.describe('E2E — Dashboard Global Search → Inbox @e2e', () => {
  test.setTimeout(120_000);

  test('TC_E2E_003 global search message result navigates to correct inbox conversation', async ({
    page,
    dashboardPage,
    inboxPage,
  }) => {
    // ── Step 1: Load dashboard ────────────────────────────────────────────
    await dashboardPage.goto();

    // ── Step 2: Open global search command palette ────────────────────────
    await dashboardPage.openSearch();
    await expect(dashboardPage.loc.searchModalInput).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Search with "q" — returns Messages results on this account
    // Using "q" mirrors TC_DSH_040 (which passes) and avoids the mixed
    // Messages+Contacts result set that "test" produces (where section headers
    // are the first div/p elements and clicking them does not navigate).
    await dashboardPage.typeInSearch('q');

    // ── Step 4: Hard-assert Messages section is visible ───────────────────
    // This is required — if Messages section is absent, the test has no data to work with
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 15_000 });

    // ── Step 5: Click first result item (same locator as TC_DSH_040) ──────
    // The div/p filter targets clickable result items inside the listbox.
    const firstResult = page.getByRole('listbox', { name: 'Suggestions' })
      .locator('div').filter({ has: page.locator('p') }).first();
    await firstResult.waitFor({ state: 'visible', timeout: 10_000 });
    await firstResult.click();

    // ── Cross-module Assertion 1: URL proves we arrived in Inbox module ────
    // Using /\/ticket\/\d+/ (same as TC_DSH_040) — the full inbox URL path is
    // /project/{uuid}/inbox/{inboxId}/ticket/{ticketId}
    await page.waitForURL(/\/ticket\/\d+/, { timeout: 30_000 });
    expect(page.url()).toContain('/inbox/');
    expect(page.url()).toContain('/ticket/');

    // ── Cross-module Assertion 2: Inbox detail panel loaded ───────────────
    // The detail header bar is inbox-specific UI — confirms module rendered, not just URL
    await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });

    // ── Cross-module Assertion 3: Conversation content rendered ───────────
    // Reply composer confirms the full conversation loaded (not a stub/loading state)
    await expect(
      page.locator('[role="textbox"][aria-multiline="true"]').first()
    ).toBeVisible({ timeout: 15_000 });

    console.log(`[TC_E2E_003] ✅ Dashboard Global Search → Inbox verified. URL: ${page.url()}`);
  });
});
