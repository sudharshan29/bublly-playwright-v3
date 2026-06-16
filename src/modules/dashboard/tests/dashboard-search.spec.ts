import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard global search — TC_DSH_034–042 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_034 clicking the search bar opens the Command Palette modal', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await expect(dashboardPage.loc.searchIsOpen).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_035 search modal shows five filter tabs', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    // Tabs (All / Messages / Contacts / Collections / Articles) only render after typing
    await dashboardPage.typeInSearch('a');
    await expect(dashboardPage.loc.searchTabAll).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.searchTabMessages).toBeVisible({ timeout: 5_000 });
    await expect(dashboardPage.loc.searchTabContacts).toBeVisible({ timeout: 5_000 });
    await expect(dashboardPage.loc.searchTabCollections).toBeVisible({ timeout: 5_000 });
    await expect(dashboardPage.loc.searchTabArticles).toBeVisible({ timeout: 5_000 });
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_036 typing a keyword returns both Messages and Contacts result sections', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 15_000 });
    await expect(dashboardPage.loc.searchContSection).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_037 clicking Messages tab keeps message results visible', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 15_000 });
    await dashboardPage.loc.searchTabMessages.click();
    await page.waitForTimeout(600);
    // Bublly search tabs scroll/highlight results but do not hide other sections
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_038 clicking Contacts tab keeps contact results visible', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    await expect(dashboardPage.loc.searchContSection).toBeVisible({ timeout: 15_000 });
    await dashboardPage.loc.searchTabContacts.click();
    await page.waitForTimeout(600);
    await expect(dashboardPage.loc.searchContSection).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_039 Messages result count in parentheses is greater than zero', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 15_000 });
    const sectionText = (await dashboardPage.loc.searchMsgSection.textContent()) ?? '';
    const match = sectionText.match(/\((\d+)\)/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBeGreaterThan(0);
    await dashboardPage.closeSearch();
  });

  test('TC_DSH_040 clicking a Messages result navigates to that conversation in inbox', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    // Wait for message results to appear
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 15_000 });
    // Click the first clickable result item
    const resultItem = page.getByRole('listbox', { name: 'Suggestions' })
      .locator('div').filter({ has: page.locator('p') }).first();
    await resultItem.waitFor({ state: 'visible', timeout: 10_000 });
    await resultItem.click();
    await page.waitForURL(/\/ticket\/\d+/, { timeout: 30_000 });
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_DSH_041 pressing Escape closes the global search modal', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await expect(dashboardPage.loc.searchIsOpen).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
    await expect(dashboardPage.loc.searchIsOpen).not.toBeVisible({ timeout: 10_000 });
  });

  test('TC_DSH_042 switching from Messages back to All restores both result sections', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openSearch();
    await dashboardPage.typeInSearch('q');
    await expect(dashboardPage.loc.searchContSection).toBeVisible({ timeout: 15_000 });
    // Switch to Messages tab (hides Contacts)
    await dashboardPage.loc.searchTabMessages.click();
    await page.waitForTimeout(500);
    // Switch back to All tab
    await dashboardPage.loc.searchTabAll.click();
    await page.waitForTimeout(600);
    // Both sections should be visible again
    await expect(dashboardPage.loc.searchMsgSection).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.searchContSection).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeSearch();
  });
});
