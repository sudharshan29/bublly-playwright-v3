import { test, expect } from '../fixtures/contacts.fixture';

// Fresh test contact with timestamp — unique per run so it never already exists.
// Isolated from fixture data (ID 7575) so blocking cannot affect other contact tests.
const RUN_ID    = Date.now();
const TEST_NAME  = 'QA Block Test';
const TEST_EMAIL = `qa.blk.${RUN_ID}@mailinator.com`;

// Captured from URL after navigating to the new contact's detail page
let contactId = '';

// Serial: each test builds on the state left by the previous one
test.describe.configure({ mode: 'serial' });

test.describe('Contacts — block and verify — TC_CON_BLK_001-004 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_BLK_001 add a fresh test contact for block testing', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await contactsPage.clickSidebarAll();
    await contactsPage.addContact(TEST_NAME, TEST_EMAIL);

    // Verify the new contact appears in search results (QA API can take a moment to index)
    await contactsPage.search(TEST_EMAIL);
    const row = contactsPage.loc.contactRows.first();
    await row.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(row).toBeVisible();
  });

  test('TC_CON_BLK_002 blocking the test contact via the Block confirmation dialog', async ({ contactsPage, page }) => {
    // Navigate to contact detail by searching and clicking the first result
    await contactsPage.goto();
    await contactsPage.clickSidebarAll();
    await contactsPage.search(TEST_EMAIL);
    const row = contactsPage.loc.contactRows.first();
    await row.waitFor({ state: 'visible', timeout: 15_000 });
    await row.click();

    // Capture contact ID from URL so TC_CON_BLK_004 can navigate back directly
    await page.waitForURL(/\/contacts\/users\//, { timeout: 10_000 });
    const match = page.url().match(/\/contacts\/users\/([^/?&#]+)/);
    contactId = match?.[1] ?? '';

    // Wait for detail page to fully settle before looking for Block action
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // Open block dialog and confirm the block
    await contactsPage.clickBlock();
    await expect(contactsPage.loc.blockDialogHeading).toBeVisible({ timeout: 10_000 });
    await contactsPage.loc.blockConfirmBtn.click();
    await page.waitForTimeout(2_500);
  });

  test('TC_CON_BLK_003 blocked contact appears in the Blocked sidebar section', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await contactsPage.clickSidebarBlocked();
    await page.waitForTimeout(1_500);

    // Blocked contact email must be visible in the blocked list
    const blockedEntry = page.getByText(TEST_EMAIL, { exact: false }).first();
    await expect(blockedEntry).toBeVisible({ timeout: 15_000 });
  });

  test('TC_CON_BLK_004 unblock contact to restore state (cleanup)', async ({ contactsPage, page }) => {
    // Navigate to the blocked contact's detail page
    if (contactId) {
      await contactsPage.gotoContact(contactId);
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    } else {
      // Fallback: find via Blocked sidebar → click first row
      await contactsPage.goto();
      await contactsPage.clickSidebarBlocked();
      await page.waitForTimeout(1_000);
      await contactsPage.loc.contactRows.first()
        .click()
        .catch(() => {});
    }

    // After blocking the action label changes from Block → Unblock — click it to restore
    const unblockDiv = page.locator('div').filter({ hasText: /^Unblock$/ }).last();
    const canUnblock = await unblockDiv.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!canUnblock) {
      test.skip(true, 'Unblock button not found — UI may not expose unblock on this QA environment');
      return;
    }

    await unblockDiv.click();
    await page.waitForTimeout(500);

    // Unblock may show a confirmation dialog — handle it if it appears
    const unblockConfirmBtn = page.getByRole('button', { name: 'Unblock', exact: true });
    const dialogVisible = await unblockConfirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (dialogVisible) {
      await unblockConfirmBtn.click();
    }
    await page.waitForTimeout(3_000);

    // After unblocking the contact must not appear in the Blocked sidebar
    await contactsPage.goto();
    await contactsPage.clickSidebarBlocked();
    await page.waitForTimeout(1_500);
    await expect(page.getByText(TEST_EMAIL, { exact: false }).first())
      .not.toBeVisible({ timeout: 5_000 });
  });
});
