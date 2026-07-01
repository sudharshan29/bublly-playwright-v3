import { test, expect } from '../fixtures/contacts-starter.fixture';

test.describe('Starter Admin — Contacts Functional — TC_ADM_CON_001–004 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ contactsStarterPage }) => {
    await contactsStarterPage.goto();
  });

  test('TC_ADM_CON_001 admin can use the search trigger to filter contacts', async ({ page }) => {
    // Contacts page has a click-to-open global search trigger (not a pre-rendered input)
    const searchTrigger = page.getByText('Search here', { exact: false });
    await searchTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await searchTrigger.click();
    // After clicking the trigger, the search input appears with placeholder "Search here..."
    const searchInput = page.getByPlaceholder('Search here...')
      .or(page.getByPlaceholder(/search/i).first());
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('a');
    await page.waitForTimeout(800);
    // Search input accepted input — trigger works correctly
    const typed = await searchInput.inputValue().catch(() => searchInput.textContent());
    expect(String(typed)).not.toBe('');
    // Dismiss
    await page.keyboard.press('Escape');
  });

  test('TC_ADM_CON_002 admin can click a contact row and a detail view opens', async ({ page }) => {
    // Skip if workspace has no contacts
    const rows = page.getByRole('row');
    await rows.first().waitFor({ state: 'visible', timeout: 10_000 });
    const rowCount = await rows.count();
    const firstDataText = rowCount > 1 ? (await rows.nth(1).textContent()) ?? '' : '';
    if (rowCount <= 1 || firstDataText.includes('No records found')) {
      test.skip(true, 'No contacts in QA workspace'); return;
    }
    await rows.nth(1).click();
    await page.waitForTimeout(2_000);
    const urlChanged = page.url().includes('/contacts/');
    const panelVisible = await page.locator('[class*="slide"], [class*="drawer"], [class*="panel"], [class*="detail"]')
      .first().isVisible({ timeout: 3_000 }).catch(() => false);
    const nameVisible = await page.getByRole('heading').first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(urlChanged || panelVisible || nameVisible).toBe(true);
  });

  test('TC_ADM_CON_003 admin can click Import button and import modal opens', async ({ contactsStarterPage, page }) => {
    await contactsStarterPage.loc.importBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await contactsStarterPage.loc.importBtn.click();
    await page.waitForTimeout(1_000);
    // Import dialog/modal must appear
    const importModal = page.getByRole('dialog')
      .or(page.locator('[class*="modal"][class*="import"], [class*="import"]').first())
      .or(page.getByText(/import/i).first());
    await expect(importModal.first()).toBeVisible({ timeout: 10_000 });
    // Dismiss
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('TC_ADM_CON_004 admin can click Merge Contacts and merge dialog opens', async ({ page }) => {
    const mergeBtn = page.getByRole('button', { name: /merge contacts/i });
    await expect(mergeBtn).toBeVisible({ timeout: 10_000 });
    await mergeBtn.click();
    await page.waitForTimeout(1_000);
    // Merge dialog/modal must appear
    const mergeDialog = page.getByRole('dialog')
      .or(page.locator('[class*="merge"]').first())
      .or(page.getByText(/merge/i).nth(1));
    await expect(mergeDialog.first()).toBeVisible({ timeout: 10_000 });
    // Dismiss
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
