import { test, expect } from '../fixtures/contacts.fixture';
import fixtureData        from '../../../../.fixtures/fixture-data.json';

const FIXTURE_ID = fixtureData.contacts.fixtureContactId;

test.describe('Contacts — Tabs verification — TC_CON_TAB_001-004 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_CON_TAB_001 Blocked sidebar tab is visible and clickable', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.sidebarBlocked).toBeVisible({ timeout: 10_000 });
    await contactsPage.loc.sidebarBlocked.click();
    await page.waitForTimeout(1_000);
    // URL or content should reflect Blocked filter
    const url  = page.url();
    const body = await page.locator('body').textContent({ timeout: 5_000 }).catch(() => '');
    expect(url.includes('blocked') || body?.includes('Blocked')).toBe(true);
  });

  test('TC_CON_TAB_002 Unsubscribed sidebar tab is visible and clickable', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.sidebarUnsubscribed).toBeVisible({ timeout: 10_000 });
    await contactsPage.loc.sidebarUnsubscribed.click();
    await page.waitForTimeout(1_000);
    const url  = page.url();
    const body = await page.locator('body').textContent({ timeout: 5_000 }).catch(() => '');
    expect(url.includes('unsubscribed') || body?.includes('Unsubscribed')).toBe(true);
  });

  test('TC_CON_TAB_003 Blocked tab loads and is accessible', async ({ contactsPage, page }) => {
    // Verify the Blocked tab is navigable and renders without error.
    // We do NOT block/unblock the fixture contact here — other tests (TC_CON_026-028)
    // depend on that contact being in an unblocked state.
    await contactsPage.goto();
    await expect(contactsPage.loc.sidebarBlocked).toBeVisible({ timeout: 10_000 });
    await contactsPage.loc.sidebarBlocked.click();
    await page.waitForTimeout(1_500);
    // Page must not crash — either shows contacts table or empty state
    const body = await page.locator('body').textContent({ timeout: 5_000 }).catch(() => '');
    expect(body).not.toContain('Something went wrong');
    expect(body?.includes('Blocked') || page.url().includes('blocked')).toBe(true);
  });

  test('TC_CON_TAB_004 Guests sidebar tab loads without error', async ({ contactsPage, page }) => {
    await contactsPage.goto();
    await expect(contactsPage.loc.sidebarGuests).toBeVisible({ timeout: 10_000 });
    await contactsPage.loc.sidebarGuests.click();
    await page.waitForTimeout(1_000);
    const body = await page.locator('body').textContent({ timeout: 5_000 }).catch(() => '');
    expect(body).not.toContain('Something went wrong');
    expect(body?.includes('Guests') || page.url().includes('guests')).toBe(true);
  });
});
