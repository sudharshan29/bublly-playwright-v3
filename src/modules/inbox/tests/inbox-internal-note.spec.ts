import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

test.describe('Inbox internal note — TC_INB_080 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_080 Note field in details sidebar accepts text input', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    // Ensure the Details tab is active so the sidebar is visible
    await inboxPage.detailsTab.click();
    await page.waitForTimeout(500);

    // The Note field is a textbox in the right Details sidebar (not a composer tab)
    await expect(inboxPage.noteTextbox).toBeVisible({ timeout: 10_000 });

    // Type a note and verify it is accepted
    await inboxPage.noteTextbox.fill('TC_INB_080 internal note — automation test');
    const typed = await inboxPage.noteTextbox.inputValue();
    expect(typed).toContain('TC_INB_080');

    // Clear without saving to avoid polluting QA data
    await inboxPage.noteTextbox.clear();
  });
});
