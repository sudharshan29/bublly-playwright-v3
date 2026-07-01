import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox — Archive & Spam — TC_ARCH_001–005 @smoke', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ archivePage }) => {
    await archivePage.goto();
  });

  test('TC_ARCH_001 Archive & spam link navigates to archived-spam URL', async ({ page }) => {
    expect(page.url()).toContain('archived-spam');
  });

  test('TC_ARCH_002 page heading shows Archive with count badge', async ({ archivePage }) => {
    const text = (await archivePage.loc.heading.textContent()) ?? '';
    expect(text).toMatch(/archive/i);
  });

  test('TC_ARCH_003 Archive tab and Spam tab are both visible', async ({ archivePage }) => {
    await expect(archivePage.loc.archiveTabBtn).toBeVisible();
    await expect(archivePage.loc.spamTabBtn).toBeVisible();
  });

  test('TC_ARCH_004 table shows all required column headers', async ({ archivePage }) => {
    await expect(archivePage.loc.table).toBeVisible();
    await expect(archivePage.loc.colTicketDetails).toBeVisible();
    await expect(archivePage.loc.colAssignee).toBeVisible();
    await expect(archivePage.loc.colCustomerName).toBeVisible();
    await expect(archivePage.loc.colStatus).toBeVisible();
    await expect(archivePage.loc.colCreatedOn).toBeVisible();
  });

  test('TC_ARCH_005 Search Sort Filter action buttons are visible', async ({ archivePage }) => {
    await expect(archivePage.loc.searchBtn).toBeVisible();
    await expect(archivePage.loc.sortBtn).toBeVisible();
    await expect(archivePage.loc.filterBtn).toBeVisible();
  });
});
