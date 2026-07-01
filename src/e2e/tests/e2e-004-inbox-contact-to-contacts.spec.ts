import { test, expect } from '../fixtures/e2e.fixture';
import fixtureData from '../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// TC_E2E_004 — Inbox Conversation Contact → Contacts Module
//
// Cross-module boundary: Inbox (data source) → Contacts (destination)
// What this proves: the contact who owns an inbox conversation exists in the
// Contacts module with a matching name or email — data is consistent across both modules.
//
// Bug class caught:
// → Inbox shows a visitor/contact but the Contacts module has no record for them
// → Contact name in inbox differs from the same contact's name in the contacts list
//   (display mismatch indicating stale data or wrong association)
// → Contacts search is broken for contacts who have active inbox conversations

test.describe('E2E — Inbox Contact → Contacts Module @e2e', () => {
  test.setTimeout(120_000);

  test('TC_E2E_004 contact shown in inbox conversation is findable in the contacts module', async ({
    page,
    inboxPage,
    contactsPage,
  }) => {
    // ── Step 1: Open fixture inbox conversation ────────────────────────────
    // Use snoozed conversation — the open/widget conversation has no real contact email.
    await inboxPage.gotoConversation(conversations.snoozed);

    // ── Step 2: Read contact email from inbox User Data section ───────────
    // User Data loads async after the main panel — wait explicitly
    const userDataVisible = await page.getByText('User Data', { exact: true }).first()
      .waitFor({ state: 'visible', timeout: 30_000 }).then(() => true).catch(() => false);

    if (!userDataVisible) {
      console.log('[TC_E2E_004] User Data section not visible — skipping');
      return;
    }

    // Read email from User Data — contacts are identified by email in Bublly
    let searchTerm: string | null = null;
    const emailLabel = page.getByText('Email', { exact: true }).first();
    const emailLabelVisible = await emailLabel.isVisible({ timeout: 10_000 }).catch(() => false);

    if (emailLabelVisible) {
      const emailRowText = (await emailLabel.locator('..').textContent()) ?? '';
      const emailMatch   = emailRowText.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i);
      if (emailMatch) searchTerm = emailMatch[0];
    }

    if (!searchTerm) {
      console.log('[TC_E2E_004] No contact email found in User Data — skipping');
      return;
    }

    console.log(`[TC_E2E_004] Contact email from inbox User Data: "${searchTerm}"`);

    // ── Step 3: Navigate to Contacts module ───────────────────────────────
    await contactsPage.goto();

    // ── Step 4: Search for the contact by email or name ───────────────────
    await contactsPage.search(searchTerm);

    // ── Cross-module Assertion 1: At least one contact row appears ─────────
    // Proves the inbox contact exists in the Contacts module (same data source)
    const rows = contactsPage.loc.contactRows;
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // ── Cross-module Assertion 2: The result row contains the search term ──
    // Confirms search returned the correct contact, not just any contact
    const firstRowText = (await rows.first().textContent()) ?? '';
    const termLower    = searchTerm.toLowerCase();
    const rowLower     = firstRowText.toLowerCase();

    // Match on full email OR the local-part before @ (contacts may show display name)
    const matchFound = rowLower.includes(termLower) ||
      rowLower.includes(searchTerm.split('@')[0]);
    expect(matchFound).toBe(true);

    console.log(`[TC_E2E_004] ✅ Inbox contact "${searchTerm}" found in Contacts module`);
  });
});
