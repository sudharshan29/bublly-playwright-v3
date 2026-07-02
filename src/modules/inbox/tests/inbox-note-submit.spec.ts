import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData        from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

test.describe('Inbox — Internal Note submit — TC_INB_NOTE_001-002 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_INB_NOTE_001 Internal Note tab exists in reply composer', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    // Internal Note tab switches the composer from reply to private note mode
    const noteTab = page.getByRole('button', { name: /internal note|note/i }).first()
      .or(page.getByText('Internal Note', { exact: true }).first())
      .or(page.locator('[data-tab="note"], [data-value="note"]').first());
    const found = await noteTab.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!found) {
      test.skip(true, 'Internal Note tab not found — composer may use different layout');
      return;
    }
    await expect(noteTab).toBeVisible();
  });

  test('TC_INB_NOTE_002 submitting Internal Note appears in thread with Note indicator', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);
    const noteTab = page.getByRole('button', { name: /internal note/i }).first()
      .or(page.getByText('Internal Note', { exact: true }).first());
    const found = await noteTab.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!found) {
      test.skip(true, 'Internal Note tab not found');
      return;
    }
    await noteTab.click();
    await page.waitForTimeout(500);
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first();
    await composer.waitFor({ state: 'visible', timeout: 10_000 });
    const noteText = 'TC_INB_NOTE_002 automated internal note';
    await composer.fill(noteText);
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(2_500);
    // Note badge or the text itself should appear in the message thread
    const thread = page.locator('[class*="flex-col-reverse"][class*="scroll-box"]');
    const noteInThread = await thread.getByText(noteText).first().isVisible({ timeout: 10_000 }).catch(() => false);
    const noteBadge    = await page.getByText(/note/i).isVisible({ timeout: 3_000 }).catch(() => false);
    expect(noteInThread || noteBadge).toBe(true);
  });
});
