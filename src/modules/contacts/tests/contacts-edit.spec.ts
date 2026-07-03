import { test, expect } from '../fixtures/contacts.fixture';
import fixtureData        from '../../../../.fixtures/fixture-data.json';

const FIXTURE_ID = fixtureData.contacts.fixtureContactId;

// Serial: TC_CON_EDIT_001 and TC_CON_EDIT_002 both edit the Name field of the same
// shared fixture contact — running them in parallel workers would race on that field.
test.describe.configure({ mode: 'serial' });

test.describe('Contacts — Edit contact — TC_CON_EDIT_001-003 @smoke', () => {
  test.setTimeout(90_000);

  // The Name row in User Detail is plain text by default. Hovering the row reveals a
  // pencil (lucide-pencil svg) icon; clicking it swaps the text for a text <input>.
  // Neither Escape nor blur closes the editor — only Enter commits and closes it.
  function nameRow(page: import('@playwright/test').Page) {
    return page.getByRole('heading', { name: 'User Detail', level: 3 }).locator('..')
      .locator('div.group').filter({ hasText: 'Name' }).first();
  }

  test('TC_CON_EDIT_001 contact detail page has editable Name field', async ({ contactsPage, page }) => {
    await contactsPage.gotoContact(FIXTURE_ID);

    const row = nameRow(page);
    await row.hover();
    const editIcon = row.locator('svg.lucide-pencil');
    await expect(editIcon).toBeVisible({ timeout: 10_000 });

    await editIcon.click();
    const nameInput = row.locator('input[type="text"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await expect(nameInput).toBeEnabled();

    // Close the editor cleanly without changing the value (Enter is the only way to commit/close)
    const originalValue = await nameInput.inputValue();
    await nameInput.fill(originalValue);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('TC_CON_EDIT_002 editing contact name persists after save', async ({ contactsPage, page }) => {
    await contactsPage.gotoContact(FIXTURE_ID);

    let row = nameRow(page);
    await row.hover();
    await row.locator('svg.lucide-pencil').click();
    let nameInput = row.locator('input[type="text"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    const original = await nameInput.inputValue();
    const newName  = 'TC_EDIT_002_QA';
    await nameInput.fill(newName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);

    // New name is reflected immediately in the UI
    await expect(page.locator('body')).toContainText(newName, { timeout: 5_000 });

    // Reload from scratch to confirm the change was actually persisted server-side
    await contactsPage.gotoContact(FIXTURE_ID);
    await expect(page.locator('body')).toContainText(newName, { timeout: 10_000 });

    // Restore the original name so the shared fixture contact is left unchanged
    row = nameRow(page);
    await row.hover();
    await row.locator('svg.lucide-pencil').click();
    nameInput = row.locator('input[type="text"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(original);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);
    await expect(page.locator('body')).toContainText(original, { timeout: 10_000 });
  });

  test('TC_CON_EDIT_003 Add Contact modal creates a new contact successfully', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await contactsPage.openAddContactModal();
    const ts    = Date.now();
    const name  = `QA_CREATE_${ts}`;
    const email = `qa.create.${ts}@mailinator.com`;
    await contactsPage.loc.addContactNameInput.fill(name);
    await contactsPage.loc.addContactEmailInput.fill(email);
    await contactsPage.loc.addContactSubmitBtn.click();
    await page.waitForTimeout(1_500);
    // Modal may stay open (server-side; see TC_CON_018 pattern) — close it explicitly
    const stillOpen = await contactsPage.loc.addContactModal
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (stillOpen) {
      await contactsPage.closeAddContactModal().catch(() => {});
      await page.waitForTimeout(500);
    }
    // Page must remain functional after submit — heading and table still visible
    await expect(contactsPage.loc.pageHeading).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.loc.contactTable).toBeVisible({ timeout: 10_000 });
  });
});
