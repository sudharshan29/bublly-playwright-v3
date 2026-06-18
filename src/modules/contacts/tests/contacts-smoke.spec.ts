import { test, expect } from '../fixtures/contacts.fixture';

test.describe('Contacts smoke — TC_CON_001–009 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_001 /contacts page loads with Contacts heading', async ({ contactsPage }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.pageHeading).toBeVisible({ timeout: 15_000 });
  });

  test('TC_CON_002 sidebar shows All Users Guests Unsubscribed and Blocked tabs', async ({ contactsPage }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.sidebarAll).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.loc.sidebarUsers).toBeVisible();
    await expect(contactsPage.loc.sidebarGuests).toBeVisible();
    await expect(contactsPage.loc.sidebarUnsubscribed).toBeVisible();
    await expect(contactsPage.loc.sidebarBlocked).toBeVisible();
  });

  test('TC_CON_003 All tab shows a count badge', async ({ contactsPage }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.allCountBadge).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CON_004 contact table has Name Email and Last Activity column headers', async ({ contactsPage }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.nameColHeader).toBeVisible({ timeout: 10_000 });
    await expect(contactsPage.loc.emailColHeader).toBeVisible();
    await expect(contactsPage.loc.activityColHeader).toBeVisible();
  });

  test('TC_CON_005 contact table shows at least one contact row', async ({ contactsPage }) => {
    await contactsPage.goto();
    const count = await contactsPage.loc.contactRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_CON_006 pagination shows total result count', async ({ contactsPage }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.paginationInfo).toBeVisible({ timeout: 10_000 });
    const text = (await contactsPage.loc.paginationInfo.textContent()) ?? '';
    expect(text).toMatch(/Showing\s+\d+\s+[–-]\s+\d+\s+of\s+\d+\s+results/);
  });

  test('TC_CON_007 clicking Users tab changes URL to ?type=user', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await contactsPage.clickSidebarUsers();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('type=user');
  });

  test('TC_CON_008 clicking Guests tab changes URL to ?type=guest', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await contactsPage.clickSidebarGuests();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('type=guest');
  });

  test('TC_CON_009 direct URL navigation does not redirect to login', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    expect(page.url()).not.toContain('login');
    expect(page.url()).toContain('/contacts');
  });
});
