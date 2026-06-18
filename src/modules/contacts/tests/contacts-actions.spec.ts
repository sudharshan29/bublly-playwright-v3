import { test, expect } from '../fixtures/contacts.fixture';

const FIXTURE_CONTACT_ID = '7575';

test.describe('Contacts actions — TC_CON_026–035 @smoke', () => {
  test.setTimeout(90_000);

  // ── Block dialog ──────────────────────────────────────────────────────

  test('TC_CON_026 Block action opens Block Contact confirmation dialog', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.clickBlock();
    await expect(contactsPage.loc.blockDialogHeading).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_027 Block dialog has an optional reason textarea', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.clickBlock();
    await expect(contactsPage.loc.blockReasonInput).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_028 Cancel in Block dialog dismisses without blocking', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.clickBlock();
    await contactsPage.cancelBlock();
    await expect(contactsPage.loc.blockDialogHeading).not.toBeVisible({ timeout: 10_000 });
    // The action bar is still intact (contact was not blocked)
    await expect(contactsPage.loc.blockAction).toBeVisible({ timeout: 10_000 });
  });

  // ── Unsubscribe toggle ────────────────────────────────────────────────

  test('TC_CON_029 Unsubscribe is a direct toggle — label flips to Resubscribe', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    // Initial state: "Unsubscribe"
    await expect(contactsPage.page.locator('div').filter({ hasText: /^Unsubscribe$/ }).last())
      .toBeVisible({ timeout: 10_000 });
    await contactsPage.toggleUnsubscribe();
    // After toggle: label must be "Resubscribe"
    await expect(contactsPage.page.locator('div').filter({ hasText: /^Resubscribe$/ }).last())
      .toBeVisible({ timeout: 10_000 });
    // Restore original state
    await contactsPage.toggleUnsubscribe();
  });

  // ── Mute toggle ───────────────────────────────────────────────────────

  test('TC_CON_030 Mute Contact is a direct toggle — label flips to Unmute Contact', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.page.locator('div').filter({ hasText: /^Mute Contact$/ }).last())
      .toBeVisible({ timeout: 10_000 });
    await contactsPage.toggleMute();
    await expect(contactsPage.page.locator('div').filter({ hasText: /^Unmute Contact$/ }).last())
      .toBeVisible({ timeout: 10_000 });
    // Restore original state
    await contactsPage.toggleMute();
  });

  // ── New Conversation modal ────────────────────────────────────────────

  test('TC_CON_031 New Conversation button opens Start a Conversation modal', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.openNewConversation();
    await expect(contactsPage.loc.newConvModalHeading).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_032 modal pre-fills the contact email in the To field', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.openNewConversation();
    // The "To:" chip shows the contact's email
    await expect(contactsPage.page.getByText('qa-conv-1781756630557@mailinator.com'))
      .toBeVisible({ timeout: 10_000 });
    await contactsPage.closeNewConversation();
  });

  test('TC_CON_033 New Conversation modal channel dropdown defaults to Widget', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await contactsPage.openNewConversation();
    await expect(contactsPage.loc.newConvChannelSelect).toBeVisible({ timeout: 10_000 });
    const channelText = (await contactsPage.loc.newConvChannelSelect.textContent()) ?? '';
    expect(channelText).toMatch(/Widget/i);
    await contactsPage.closeNewConversation();
  });

  // ── Column settings ───────────────────────────────────────────────────

  test('TC_CON_034 column settings dropdown opens and shows 5 column options', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.openColumnSettings();
    const opts = [
      contactsPage.loc.colOptionName,
      contactsPage.loc.colOptionEmail,
      contactsPage.loc.colOptionLocation,
      contactsPage.loc.colOptionLanguage,
      contactsPage.loc.colOptionLastActivity,
    ];
    for (const opt of opts) {
      await expect(opt).toBeVisible({ timeout: 10_000 });
    }
  });

  test('TC_CON_035 Location and Language columns are hidden in table by default', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    // Default visible columns: Name, Email, Last Activity
    // Default hidden columns: Location, Language — no columnheader rendered for them
    await expect(page.getByRole('columnheader', { name: 'Location' })).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('columnheader', { name: 'Language' })).not.toBeVisible({ timeout: 5_000 });
  });
});
