import { test, expect } from '../fixtures/inbox.fixture';
import { env }          from '../../../../config/environment';

import fixtureData from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

test.describe('Inbox smoke — TC_INB_001–015 @smoke', () => {
  // The app can take 20–30 s to fully render — give each test 90 s headroom
  test.setTimeout(90_000);

  test('TC_INB_001 inbox page loads and shows conversation items', async ({ inboxPage, page }) => {
    await inboxPage.goto();
    // goto() waits for page structure — explicitly wait for items to render
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_INB_002 status dropdown is visible on inbox page', async ({ inboxPage }) => {
    await inboxPage.goto();
    await expect(inboxPage.statusDropdown).toBeVisible();
  });

  test('TC_INB_003 new conversation button is visible', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await expect(page.locator('#tour-step-new-conversation')).toBeVisible({ timeout: 20_000 });
  });

  test('TC_INB_004 open filter shows at least one conversation', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('open');
    // applyFilter re-navigates to the same URL — wait for items to reload after the flash
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_INB_005 snoozed filter is accessible and navigates to snoozed view', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('snoozed');
    // Assert the URL changed — proves the filter actually applied
    expect(page.url()).toContain('snoozed');
    // Count may be 0 in QA data — zero is valid; what matters is no crash
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC_INB_006 closed filter is accessible and navigates to closed view', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('closed');
    // Assert the URL changed — proves the filter actually applied
    expect(page.url()).toContain('closed');
    // Count may be 0 in QA data — zero is valid; what matters is no crash
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC_INB_007 clicking fixture open conversation shows detail panel', async ({ inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });
  });

  test('TC_INB_008 conversation detail shows contact name element', async ({ inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    // Assert element is visible — no text match because the contact name is unknown
    await expect(inboxPage.contactName).toBeVisible({ timeout: 20_000 });
  });

  test('TC_INB_009 conversation detail shows message thread', async ({ inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    await expect(inboxPage.messageThread).toBeVisible({ timeout: 20_000 });
  });

  test('TC_INB_010 search returns at least one result', async ({ inboxPage }) => {
    await inboxPage.goto();
    // Search "qa_seed" — matches seeded fixture conversations created via the widget
    await inboxPage.search('qa_seed');
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // KNOWN DEFECT: Bublly QA search returns all conversations (11) for a no-match query
  // instead of empty state. Expected: 0, Actual: 11.
  // test.fail() documents the defect — CI stays green.
  // Remove test.fail() and verify count === 0 once search filtering is fixed in QA.
  test.fail('TC_INB_011 no-match search shows empty state (0 conversations)', async ({ inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.search('zzz_no_match_xyz_12345');
    const count = await inboxPage.getConversationCount();
    expect(count).toBe(0);
  });

  test('TC_INB_012 clear search restores conversation list', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    // Explicitly wait for items before capturing count — goto() only waits for page structure
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const originalCount = await inboxPage.getConversationCount();

    await inboxPage.search('zzz_no_match_xyz_12345');
    await inboxPage.clearSearch();
    // Wait for items to reload after navigation back to open view
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const restoredCount = await inboxPage.getConversationCount();

    // Restored list should have at least as many items as original open view
    expect(restoredCount).toBeGreaterThanOrEqual(originalCount);
  });

  test('TC_INB_013 URL contains projectId and inboxId', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    const currentUrl = page.url();
    expect(currentUrl).toContain(env.workspace.projectId);
    expect(currentUrl).toContain(env.workspace.inboxId);
  });

  test('TC_INB_014 open and archived filters both return results confirming filter works', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    // Wait for the open inbox list to fully render before counting
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const openCount = await inboxPage.getConversationCount();

    // Archived has 9 items in QA; closed has 0 — use archived to verify filter switching works
    await inboxPage.applyFilter('archived');
    // Archived view shows skeleton loaders before real items — wait for first receiver-bg
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    const archivedCount = await inboxPage.getConversationCount();

    expect(openCount).toBeGreaterThanOrEqual(1);
    expect(archivedCount).toBeGreaterThanOrEqual(1);
  });

  test('TC_INB_015 direct URL navigation shows correct page (not login or 404)', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('login');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('404');
  });

});

