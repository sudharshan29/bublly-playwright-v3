import { test, expect } from '../fixtures/contacts.fixture';

test.describe('Contacts search — TC_CON_010–014 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_010 filter icon reveals search input', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.openSearch();
    await expect(contactsPage.loc.searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_011 typing a query filters results and input retains value', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.search('QA Conv');
    // Input retains what was typed
    await expect(contactsPage.loc.searchInput).toHaveValue('QA Conv', { timeout: 5_000 });
    // Filtered count > 0 (QA Conv contacts exist)
    const filteredCount = await contactsPage.getTotalCount();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
  });

  test('TC_CON_012 search result count is less than total contact count', async ({ contactsPage }) => {
    await contactsPage.goto();
    const totalBefore = await contactsPage.getTotalCount();
    await contactsPage.search('QA Conv');
    // Poll until pagination updates — server-side filtering can take longer than the fixed wait
    await expect.poll(() => contactsPage.getTotalCount(), { timeout: 10_000 }).toBeLessThan(totalBefore);
  });

  test('TC_CON_013 clear button restores full contact list', async ({ contactsPage }) => {
    await contactsPage.goto();
    const totalBefore = await contactsPage.getTotalCount();
    await contactsPage.search('QA Conv');
    await contactsPage.clearSearch();
    const totalAfter = await contactsPage.getTotalCount();
    expect(totalAfter).toBe(totalBefore);
  });

  test('TC_CON_014 searching a non-existent term returns 0 results', async ({ contactsPage }) => {
    await contactsPage.goto();
    await contactsPage.search('zzzthisshouldnotexist99999');
    await contactsPage.page.waitForTimeout(800);
    const count = await contactsPage.loc.contactRows.count();
    expect(count).toBe(0);
  });
});
