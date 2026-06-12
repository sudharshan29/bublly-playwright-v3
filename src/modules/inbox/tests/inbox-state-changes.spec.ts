import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Serial: TC_INB_051 must run after TC_INB_050 because they share the open fixture (7555).
// Archive is a toggle — TC_INB_051 archives then immediately restores the fixture.
// TC_INB_050 only reaches the confirmation dialog and cancels, leaving 7555 untouched.
test.describe.configure({ mode: 'serial' });

test.describe('Inbox conversation state changes — TC_INB_050-051 @smoke', () => {
  test.setTimeout(120_000);

  // Action icon locator shared across both tests.
  // All 4 header icons share this class; .last() = More Options (confirmed from live DOM)
  const moreOptionsLoc = (page: any) =>
    page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]').last();

  test('TC_INB_050 Close Conversation option in More Options opens confirmation dialog', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Open More Options menu
    await moreOptionsLoc(page).click();
    const closeMenuItem = page.getByRole('dialog').getByText('Close Conversation', { exact: true });
    await closeMenuItem.waitFor({ state: 'visible', timeout: 10_000 });

    // Click "Close Conversation"
    await closeMenuItem.click();

    // Confirmation dialog must appear with the expected message and action buttons
    await expect(page.getByText(/are you sure you want to close this conversation/i))
      .toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Close',  exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();

    // Cancel — preserve the open fixture for subsequent tests
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // Confirm dialog dismissed and fixture still accessible
    await expect(page.getByText(/are you sure you want to close this conversation/i))
      .not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_INB_051 Archive Ticket moves conversation to archived state and restores it', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // --- Step 1: archive the ticket ---
    await moreOptionsLoc(page).click();
    const archiveMenuItem = page.getByRole('dialog').getByText('Archive Ticket', { exact: true });
    await archiveMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await archiveMenuItem.click();
    // Archive is immediate (no confirmation dialog)
    await page.waitForTimeout(2_500);

    // --- Step 2: verify ticket is now in archived view ---
    await inboxPage.gotoConversation(conversations.open, 'archived');
    // If the ticket loaded correctly at the archived URL, the composer should be visible
    const composerVisible = await page.locator('[role="textbox"][aria-multiline="true"]').first()
      .isVisible({ timeout: 15_000 }).catch(() => false);
    const inboxFilterText = await page.getByRole('combobox').first().textContent().catch(() => '');
    const isArchived = composerVisible || (inboxFilterText ?? '').toLowerCase().includes('archiv');
    expect(isArchived).toBe(true);

    // --- Step 3: unarchive (restore fixture) — Archive Ticket is a toggle ---
    await moreOptionsLoc(page).click();
    await archiveMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await archiveMenuItem.click();
    await page.waitForTimeout(2_500);

    // --- Step 4: confirm fixture is back in open view ---
    await inboxPage.gotoConversation(conversations.open, 'open');
    await expect(page.locator('[role="textbox"][aria-multiline="true"]').first())
      .toBeVisible({ timeout: 20_000 });
  });

});
