import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

test.describe('Inbox tags and due date — TC_INB_078-079 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_078 Tags field in details sidebar accepts text input', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Ensure the Details tab is active
    await inboxPage.detailsTab.click();
    await page.waitForTimeout(500);

    // Tags field is an input with placeholder exactly "Select" (not "Select date")
    const tagsInput = page.getByPlaceholder('Select', { exact: true });
    await expect(tagsInput).toBeVisible({ timeout: 10_000 });

    // Click the field and type a tag
    await tagsInput.click();
    await tagsInput.fill('automation-tag');

    // Verify the typed value is present in the field
    const value = await tagsInput.inputValue();
    expect(value).toContain('automation-tag');

    // Clean up
    await tagsInput.clear();
    await page.keyboard.press('Escape');
  });

  test('TC_INB_079 Due date picker opens when due date trigger is clicked', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Ensure the Details tab is active
    await inboxPage.detailsTab.click();
    await page.waitForTimeout(500);

    // Due Date row — find the label then click the date value beside it (may be "No Due Date", "--", or an actual date)
    const dueDateRow = page.getByText('Due Date', { exact: true }).first().locator('..');
    await expect(dueDateRow).toBeVisible({ timeout: 10_000 });
    const dueDateTrigger = dueDateRow.locator('input, button, [class*="cursor-pointer"]').first();
    await dueDateTrigger.click();
    await page.waitForTimeout(500);

    // A calendar / date-picker dialog must appear
    const picker = page.locator('[class*="calendar"], [class*="datepicker"]').first()
      .or(page.getByRole('dialog').filter({ hasText: /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i }).first());
    await expect(picker).toBeVisible({ timeout: 8_000 });

    // Dismiss without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });
});
