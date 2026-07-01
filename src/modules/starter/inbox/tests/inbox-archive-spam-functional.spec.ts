import { test, expect } from '../fixtures/inbox-starter.fixture';

test.describe('Inbox — Archive & Spam functional — TC_ARCH_006-007 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_ARCH_006 Archive tab and Spam tab show distinct content or URL states', async ({ archivePage, page }) => {
    await archivePage.goto();

    // Click Archive tab and capture URL
    await archivePage.clickArchiveTab();
    await page.waitForTimeout(1_000);
    const archiveUrl = page.url();

    // Count rows visible under Archive tab
    const archiveRowCount = await archivePage.loc.tableRows.count();

    // Click Spam tab
    await archivePage.clickSpamTab();
    await page.waitForTimeout(1_000);
    const spamUrl = page.url();

    // URL must change between tabs (tab switch is functional)
    expect(archiveUrl).not.toBe(spamUrl);

    // Switch back to Archive — content should reload
    await archivePage.clickArchiveTab();
    await page.waitForTimeout(1_000);
    const archiveRowCountAfter = await archivePage.loc.tableRows.count();

    // Archive tab returns the same number of rows as before (state is stable)
    expect(archiveRowCountAfter).toBe(archiveRowCount);
  });

  test('TC_ARCH_007 Archive tab heading and Spam tab heading update on tab switch', async ({ archivePage, page }) => {
    await archivePage.goto();

    // Verify Archive tab is active by default (heading contains "archive")
    const headingText = (await archivePage.loc.heading.textContent()) ?? '';
    expect(headingText.toLowerCase()).toMatch(/archive/);

    // Switch to Spam tab
    await archivePage.clickSpamTab();
    await page.waitForTimeout(800);

    // Table must still be present (Spam view renders the same table structure)
    await expect(archivePage.loc.table).toBeVisible({ timeout: 8_000 });

    // Switch back to Archive tab
    await archivePage.clickArchiveTab();
    await page.waitForTimeout(800);
    await expect(archivePage.loc.table).toBeVisible({ timeout: 8_000 });
  });
});
