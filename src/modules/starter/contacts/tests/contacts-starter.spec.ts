import { test, expect } from '../fixtures/contacts-starter.fixture';

test.describe('Starter Contacts — TC_CON_S_001–005 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ contactsStarterPage }) => {
    await contactsStarterPage.goto();
  });

  test('TC_CON_S_001 Contacts URL is correct after navigation', async ({ page }) => {
    expect(page.url()).toContain('/contacts');
  });

  test('TC_CON_S_002 Contacts table renders with Name and Email columns', async ({ contactsStarterPage }) => {
    await expect(contactsStarterPage.loc.contactTable).toBeVisible();
    await expect(contactsStarterPage.loc.nameColHeader).toBeVisible();
    await expect(contactsStarterPage.loc.emailColHeader).toBeVisible();
  });

  test('TC_CON_S_003 sidebar shows All and Users segments', async ({ contactsStarterPage }) => {
    await expect(contactsStarterPage.loc.sidebarAll).toBeVisible();
    await expect(contactsStarterPage.loc.sidebarUsers).toBeVisible();
  });

  test('TC_CON_S_004 Import button is visible in toolbar', async ({ contactsStarterPage }) => {
    await expect(contactsStarterPage.loc.importBtn).toBeVisible();
  });

  test('TC_CON_S_005 Add Contact button is visible for admin', async ({ contactsStarterPage }) => {
    await expect(contactsStarterPage.loc.addContactBtn).toBeVisible();
  });
});
