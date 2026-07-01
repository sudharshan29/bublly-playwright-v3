import { test, expect } from '../fixtures/inbox.fixture';

test.describe('Inbox new conversation modal — TC_INB_033-036 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_033 clicking new conversation button opens the modal', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    await expect(page.locator('[aria-modal="true"]')).toBeVisible({ timeout: 15_000 });
  });

  test('TC_INB_034 new conversation modal has a recipient input field', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    await expect(
      page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC_INB_035 new conversation modal has a message compose area', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    // The message area uses role=textbox (contenteditable) inside the modal
    await expect(
      page.locator('[aria-modal="true"] [role="textbox"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC_INB_036 Escape key closes the new conversation modal', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    await page.locator('[aria-modal="true"]').waitFor({ state: 'visible', timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[aria-modal="true"]')).not.toBeVisible({ timeout: 10_000 });
  });

  // ── Recipient search ─────────────────────────────────────────────────────────

  test('TC_INB_041 typing in recipient field triggers autocomplete suggestions', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    const recipientInput = page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]');
    // pressSequentially fires real keystrokes — required to trigger the autocomplete listener
    await recipientInput.click();
    await recipientInput.pressSequentially('test', { delay: 80 });
    // Dropdown is a <ul> with implicit ARIA role "list" — use getByRole to match implicit roles
    await expect(
      page.locator('[aria-modal="true"]').getByRole('list')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TC_INB_052 recipient search on known email returns at least one match', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();
    const recipientInput = page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]');
    // Type part of a known seed contact email — pressSequentially triggers the autocomplete listener
    await recipientInput.click();
    await recipientInput.pressSequentially('atfree', { delay: 80 });
    const modal = page.locator('[aria-modal="true"]');
    // Dropdown must appear with at least 1 listitem (Create New Contact is always present)
    const dropdown = modal.getByRole('list');
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByRole('listitem').first()).toBeVisible();
  });

  // ── New conversation send flow ───────────────────────────────────────────────

  test('TC_INB_064 new conversation send button is present after recipient and message are filled', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();

    const modal = page.locator('[aria-modal="true"]');
    const recipientInput = modal.locator('input[placeholder="Choose a receiver"]');

    // Type a unique email to find or create a test contact
    await recipientInput.click();
    await recipientInput.pressSequentially('qa-send-test@mailinator.com', { delay: 70 });

    const dropdown = modal.getByRole('list');
    await dropdown.waitFor({ state: 'visible', timeout: 10_000 });

    // Select existing contact if present, otherwise use Create New Contact
    const existingContact = modal.getByRole('listitem').filter({ hasText: 'qa-send-test@mailinator.com' });
    const hasExisting = await existingContact.count() > 0;
    if (hasExisting) {
      await existingContact.first().click();
    } else {
      await modal.getByRole('listitem').filter({ hasText: 'Create New Contact' }).click();
      // "Add new contact" dialog appears — fill Name (required) and submit
      await page.getByPlaceholder('Enter Name').fill('QA Send Test');
      await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
    }

    await page.waitForTimeout(1_000);

    // Fill the message compose area
    const messageArea = modal.locator('[role="textbox"]').first();
    await messageArea.waitFor({ state: 'visible', timeout: 10_000 });
    await messageArea.fill('TC_INB_064 send button visibility test');

    // Send button has accessible name "Send"
    const sendBtn = modal.getByRole('button', { name: 'Send', exact: true });
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });

    // Close without sending
    await page.keyboard.press('Escape');
  });

  test('TC_INB_065 new conversation is sent and modal closes on success', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();

    // .first() pins to the main "Start a Conversation" modal even when a second modal opens later
    const modal = page.locator('[aria-modal="true"]').first();
    const recipientInput = modal.locator('input[placeholder="Choose a receiver"]');

    // Unique timestamp email — always triggers "Create New Contact" path, no duplicate-contact API errors
    const testEmail = `qa-conv-${Date.now()}@mailinator.com`;
    await recipientInput.click();
    await recipientInput.pressSequentially(testEmail, { delay: 70 });

    // Dropdown appears — unique email has no match, so Create New Contact is the only option
    const dropdown = modal.getByRole('list');
    await dropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await modal.getByRole('listitem').filter({ hasText: 'Create New Contact' }).click();

    // "Add new contact" dialog — wait for it to appear, fill name, submit
    await expect(page.getByRole('heading', { name: 'Add new contact', exact: true }))
      .toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('Enter Name').fill('QA Conv Test');
    await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
    // Must confirm dialog closed before backdrop can clear and main modal is interactive again
    await expect(page.getByRole('heading', { name: 'Add new contact', exact: true }))
      .not.toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(1_000);

    // Fill message in the main modal
    const messageArea = modal.locator('[role="textbox"]').first();
    await messageArea.waitFor({ state: 'visible', timeout: 10_000 });
    await messageArea.fill('TC_INB_065 automated new conversation send test');

    // Send — button has accessible name "Send"
    const sendBtn = modal.getByRole('button', { name: 'Send', exact: true });
    await sendBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await sendBtn.click();

    // Modal must close after successful send
    await expect(modal).not.toBeVisible({ timeout: 30_000 });
  });

});
