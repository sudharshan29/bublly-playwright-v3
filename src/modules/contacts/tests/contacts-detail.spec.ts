import { test, expect } from '../fixtures/contacts.fixture';

// Uses a known stable contact (id=7575) created during inbox tests.
// This contact has a conversation, session history, and activities.
const FIXTURE_CONTACT_ID = '7575';

test.describe('Contacts detail page — TC_CON_019–025 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_019 clicking a contact row navigates to /contacts/users/{id}', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    const firstLink = contactsPage.loc.contactRows.first().getByRole('link').first();
    await firstLink.waitFor({ state: 'visible', timeout: 15_000 });
    await firstLink.click();
    await page.waitForURL(/\/contacts\/users\/\d+/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/contacts\/users\/\d+/);
  });

  test('TC_CON_020 contact detail shows name and email in User Detail section', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.loc.userDetailHeading).toBeVisible({ timeout: 15_000 });
    // Field labels appear as text nodes inside the User Detail section
    await expect(contactsPage.page.getByText(/\bName\b/).first()).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.page.getByText(/\bEmail\b/).first()).toBeVisible();
  });

  test('TC_CON_021 contact detail shows User ID Company ID Language and Location fields', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.loc.userDetailHeading).toBeVisible({ timeout: 15_000 });
    await expect(contactsPage.page.getByText('User ID').first()).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.page.getByText('Company ID').first()).toBeVisible();
    await expect(contactsPage.page.getByText('Language').first()).toBeVisible();
    await expect(contactsPage.page.getByText('Location').first()).toBeVisible();
  });

  test('TC_CON_022 Conversation Timeline section is visible', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.loc.conversationTimelineHeading).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_023 Session History section shows Signed up date', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.loc.sessionHistoryHeading).toBeVisible({ timeout: 10_000 });
    const section = contactsPage.page.locator('h3').filter({ hasText: 'Session History' }).locator('..');
    await expect(section.getByText('Signed up:', { exact: true })).toBeVisible();
  });

  test('TC_CON_024 Activities section shows at least one activity item', async ({ contactsPage }) => {
    await contactsPage.gotoContact(FIXTURE_CONTACT_ID);
    await expect(contactsPage.loc.activitiesHeading).toBeVisible({ timeout: 10_000 });
    const items = contactsPage.loc.activitiesList.getByRole('listitem');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_CON_025 Back button navigates back to contacts list', async ({ contactsPage, page }) => {
    // Build real browser history: go to contacts list first, then click into a contact
    // so that Back has /contacts as the previous entry (not about:blank)
    await contactsPage.goto();
    const firstLink = contactsPage.loc.contactRows.first().getByRole('link').first();
    await firstLink.waitFor({ state: 'visible', timeout: 15_000 });
    await firstLink.click();
    await page.waitForURL(/\/contacts\/users\/\d+/, { timeout: 15_000 });
    await contactsPage.loc.backBtn.click();
    await contactsPage.loc.pageHeading.waitFor({ state: 'visible', timeout: 20_000 });
    expect(page.url()).not.toContain('/users/');
  });
});
