import { test, expect } from '../fixtures/contacts.fixture';

test.describe('Contacts add contact — TC_CON_015–018 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_015 Add Contact button opens modal with heading', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.openAddContactModal();
    await expect(contactsPage.loc.addContactModal).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_016 modal has Name and Email input fields', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.openAddContactModal();
    await expect(contactsPage.loc.addContactNameInput).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.loc.addContactEmailInput).toBeVisible();
  });

  test('TC_CON_017 Close button dismisses the Add Contact modal', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.openAddContactModal();
    await contactsPage.closeAddContactModal();
    await expect(contactsPage.loc.addContactModal).not.toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_018 submitting Add Contact form with valid data does not crash the page', async ({ contactsPage }) => {
    const ts    = Date.now();
    const name  = `QA Auto ${ts}`;
    const email = `qa-auto-${ts}@mailinator.com`;

    await contactsPage.goto();
    await contactsPage.openAddContactModal();
    await contactsPage.loc.addContactNameInput.fill(name);
    await contactsPage.loc.addContactEmailInput.fill(email);
    await contactsPage.loc.addContactSubmitBtn.click();
    await contactsPage.page.waitForTimeout(1_500);
    await contactsPage.closeAddContactModal();
    // Page must remain functional after submit
    await expect(contactsPage.loc.pageHeading).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.loc.contactTable).toBeVisible({ timeout: 10_000 });
  });
});
