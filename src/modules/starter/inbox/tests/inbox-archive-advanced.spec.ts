import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox archive — search, sort, filter controls — TC_ARCH_ADV_001-004 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ archivePage }) => {
    await archivePage.goto();
    await archivePage.clickArchiveTab();
  });

  test('TC_ARCH_ADV_001 Archive tab displays Search button', async ({ archivePage }) => {
    await expect(archivePage.loc.searchBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC_ARCH_ADV_002 Archive tab Search button opens a search input or updates the URL', async ({ archivePage, page }) => {
    await archivePage.loc.searchBtn.click();
    await page.waitForTimeout(800);

    // Either a search textbox appears OR the URL gains a search-related query param
    const searchbox  = page.getByRole('searchbox').or(page.getByRole('textbox')).first();
    const inputShown = await searchbox.isVisible({ timeout: 5_000 }).catch(() => false);
    const urlUpdated = page.url().includes('search');
    expect(inputShown || urlUpdated).toBe(true);
  });

  test('TC_ARCH_ADV_003 Archive tab displays Sort button', async ({ archivePage }) => {
    await expect(archivePage.loc.sortBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC_ARCH_ADV_004 Archive tab displays Filter button', async ({ archivePage }) => {
    await expect(archivePage.loc.filterBtn).toBeVisible({ timeout: 10_000 });
  });
});
