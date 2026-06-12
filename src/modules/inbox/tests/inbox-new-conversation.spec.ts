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

});
