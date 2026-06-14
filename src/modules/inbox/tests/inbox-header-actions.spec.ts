import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Header action icons: all 4 are SVG inside div with class pattern below.
// Order (left→right): 0=Snooze, 1=Set Unread, 2=Copy Link, 3=More Options
const headerIconLoc = (page: any) =>
  page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]');

test.describe('Inbox header actions — TC_INB_060-061 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_INB_060 Set Unread icon click changes the icon visual state', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    const setUnreadBtn = headerIconLoc(page).nth(1);
    await setUnreadBtn.waitFor({ state: 'visible', timeout: 10_000 });

    // Capture SVG innerHTML before click — the fill class changes on toggle
    const htmlBefore = await setUnreadBtn.innerHTML();

    await setUnreadBtn.click();
    await page.waitForTimeout(1_000);

    const htmlAfter = await setUnreadBtn.innerHTML();

    // The icon SVG fill class changes to indicate "unread" state
    expect(htmlAfter).not.toBe(htmlBefore);

    // Restore: click again to toggle back to read
    await setUnreadBtn.click();
    await page.waitForTimeout(500);
  });

  test('TC_INB_061 Copy Link icon writes the ticket URL to clipboard', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    const copyLinkBtn = headerIconLoc(page).nth(2);
    await copyLinkBtn.waitFor({ state: 'visible', timeout: 10_000 });

    // Intercept navigator.clipboard.writeText to capture the copied value
    await page.evaluate(() => {
      (window as any).__lastCopied = null;
      const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (text: string) => {
        (window as any).__lastCopied = text;
        return orig(text);
      };
    });

    await copyLinkBtn.click();
    await page.waitForTimeout(500);

    const copied: string | null = await page.evaluate(() => (window as any).__lastCopied);

    // Copied URL must contain the ticket ID and the "ticket/" path segment
    expect(copied).not.toBeNull();
    expect(copied).toContain('ticket/');
    expect(copied).toContain(conversations.open);
  });

});
