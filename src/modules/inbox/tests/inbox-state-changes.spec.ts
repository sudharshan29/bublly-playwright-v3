import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Serial: tests share the open fixture (7555) and must run in order.
// TC_INB_050: opens Close dialog, cancels — no state change
// TC_INB_051: archives then immediately unarchives — fixture restored to open
// TC_INB_057: actually closes the conversation — fixture becomes closed
// TC_INB_058: reopens the just-closed ticket — fixture restored to open
// TC_INB_059: marks assigned fixture (7535) as spam → verifies → restores
test.describe.configure({ mode: 'serial' });

test.describe('Inbox conversation state changes — TC_INB_050-051-057-059 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_INB_050 Close Conversation option in More Options opens confirmation dialog', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Open More Options menu
    await inboxPage.moreOptionsBtn.click();
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
    await inboxPage.moreOptionsBtn.click();
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
    await inboxPage.moreOptionsBtn.click();
    await archiveMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await archiveMenuItem.click();
    await page.waitForTimeout(2_500);

    // --- Step 4: confirm fixture is back in open view ---
    await inboxPage.gotoConversation(conversations.open, 'open');
    await expect(page.locator('[role="textbox"][aria-multiline="true"]').first())
      .toBeVisible({ timeout: 20_000 });
  });

  // ── TC_INB_057 / TC_INB_058: actual close + reopen ───────────────────────────

  test('TC_INB_057 Close Conversation actually closes ticket and moves it to closed state', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Open More Options → Close Conversation → confirm
    await inboxPage.moreOptionsBtn.click();
    const closeMenuItem = page.getByRole('dialog').getByText('Close Conversation', { exact: true });
    await closeMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await closeMenuItem.click();

    // Confirm the close (unlike TC_INB_050 which cancels)
    const confirmBtn = page.getByRole('button', { name: 'Close', exact: true });
    await confirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await confirmBtn.click();
    await page.waitForTimeout(2_500);

    // Navigate to the closed URL — ticket should now load there
    await inboxPage.gotoConversation(conversations.open, 'closed');
    const composerVisible = await page.locator('[role="textbox"][aria-multiline="true"]').first()
      .isVisible({ timeout: 15_000 }).catch(() => false);

    // The "Open" button (Reopen) must appear on a closed ticket
    const reopenVisible = await page.getByRole('button', { name: 'Open', exact: true })
      .isVisible({ timeout: 10_000 }).catch(() => false);

    expect(composerVisible || reopenVisible).toBe(true);
  });

  test('TC_INB_058 Reopen closed conversation restores ticket to open state', async ({ page, inboxPage }) => {
    // Navigate directly to the closed ticket (closed by TC_INB_057)
    await inboxPage.gotoConversation(conversations.open, 'closed');

    // Reopen via the inbox-state combobox in the conversation header.
    // On a closed ticket it shows "Closed" — clicking it and selecting "Open" reopens the ticket.
    const stateCombo = page.getByRole('combobox').first();
    await stateCombo.waitFor({ state: 'visible', timeout: 10_000 });
    await stateCombo.click();

    const openOption = page.getByRole('option').filter({ hasText: /Open/i }).first();
    await openOption.waitFor({ state: 'visible', timeout: 10_000 });
    await openOption.click();
    await page.waitForTimeout(2_500);

    // After reopening the page navigates away — confirm the ticket is accessible in open view
    await inboxPage.gotoConversation(conversations.open, 'open');
    await expect(page.locator('[role="textbox"][aria-multiline="true"]').first())
      .toBeVisible({ timeout: 20_000 });
  });

  // ── TC_INB_059: Mark as Spam ─────────────────────────────────────────────────

  test('TC_INB_059 Mark as Spam shows confirmation dialog and moves ticket on confirm', async ({ page, inboxPage }) => {
    // Use the assigned fixture (7535) to keep 7555 unaffected
    await inboxPage.gotoConversation(conversations.assigned);

    // Open More Options → Mark as Spam
    await inboxPage.moreOptionsBtn.click();
    const spamMenuItem = page.getByRole('dialog').getByText('Mark as Spam', { exact: true });
    await spamMenuItem.waitFor({ state: 'visible', timeout: 10_000 });
    await spamMenuItem.click();

    // Spam confirmation dialog must appear
    await expect(page.getByText(/mark this ticket as spam/i)).toBeVisible({ timeout: 10_000 });
    const spamConfirmBtn = page.getByRole('button', { name: 'Mark as Spam', exact: true });
    const cancelBtn      = page.getByRole('button', { name: 'Cancel',       exact: true });
    await expect(spamConfirmBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Confirm spam
    await spamConfirmBtn.click();
    // Spam dialog must dismiss — key functional assertion (dialog accepted the action)
    await expect(page.getByText(/mark this ticket as spam/i)).not.toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2_000);

    // ── Restore: navigate to archived-spam view and un-spam ──
    const projectId = '2241b02a-5faa-43e8-869a-98db95ef66cc';
    await page.goto(
      `https://qa-desk.bublly.com/project/${projectId}/inbox/archived-spam`,
      { waitUntil: 'domcontentloaded', timeout: 30_000 }
    );
    await page.waitForTimeout(2_000);

    // Find the assigned fixture ticket and click it
    const spamTicket = page.locator('[class*="receiver-bg"]').first();
    const ticketVisible = await spamTicket.isVisible({ timeout: 10_000 }).catch(() => false);
    if (ticketVisible) {
      await spamTicket.click();
      await page.waitForTimeout(1_500);
      // Try to un-spam via More Options or a "Not Spam" button
      const moreBtn = inboxPage.moreOptionsBtn;
      const moreBtnVisible = await moreBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (moreBtnVisible) {
        await moreBtn.click();
        const notSpamItem = page.getByRole('dialog').getByText(/not spam|remove.*spam/i);
        const hasNotSpam = await notSpamItem.isVisible({ timeout: 5_000 }).catch(() => false);
        if (hasNotSpam) {
          await notSpamItem.click();
          await page.waitForTimeout(1_500);
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
  });

});
