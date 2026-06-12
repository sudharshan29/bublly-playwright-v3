import { test, expect } from '../fixtures/inbox.fixture';

test.describe('Inbox filters — TC_INB_016-021 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_016 My Inbox filter click navigates to /my-inbox/ URL', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('mine');
    expect(page.url()).toContain('/my-inbox/');
  });

  test('TC_INB_017 My Inbox filter shows at least one conversation', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('mine');
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_INB_018 Unassigned filter click navigates to /unassigned/ URL', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('unassigned');
    expect(page.url()).toContain('/unassigned/');
  });

  test('TC_INB_019 Unassigned filter shows at least one conversation', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.applyFilter('unassigned');
    await page.locator('[class*="receiver-bg"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC_INB_020 My Inbox and All sidebar badges render numeric counts', async ({ page, inboxPage }) => {
    await inboxPage.goto();

    // Badge structure: [ img | "My Inbox" ] + <p>29</p> share a common wrapper.
    // Two locator(..) calls walk up two levels from the label text to the row wrapper.
    const myInboxRow  = page.getByText('My Inbox', { exact: true }).first().locator('..').locator('..');
    const myInboxBadge = myInboxRow.locator('p').first();
    await expect(myInboxBadge).toBeVisible({ timeout: 10_000 });
    const myBadgeText = (await myInboxBadge.textContent()) ?? '';
    expect(myBadgeText.trim()).toMatch(/^\d+$|^99\+$/);

    // "All" filter — first match is the sidebar entry (list header "All" appears later in DOM)
    const allRow   = page.getByText('All', { exact: true }).first().locator('..').locator('..');
    const allBadge = allRow.locator('p').first();
    await expect(allBadge).toBeVisible({ timeout: 10_000 });
    const allText  = (await allBadge.textContent()) ?? '';
    expect(allText.trim()).toMatch(/^\d+$|^99\+$/);
  });

  test('TC_INB_021 Inbox Settings link opens the settings dialog', async ({ page, inboxPage }) => {
    await inboxPage.goto();
    await inboxPage.clickInboxSettings();
    await expect(page.getByRole('heading', { name: 'Inbox Settings' })).toBeVisible({ timeout: 10_000 });
    // Close the dialog to leave the page in a clean state
    await page.getByRole('button', { name: 'Close dialog' }).click();
  });

});
