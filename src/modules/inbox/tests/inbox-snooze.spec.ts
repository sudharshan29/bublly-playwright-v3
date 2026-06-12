import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Snooze button = first of 4 header action icon divs (NOT a <button>).
// Options confirmed from live DOM: Later Today, Tomorrow, Next Week, One Week, Next Month, Custom
// All options are plain divs inside role="dialog" (NOT role="menuitem").
const snoozeBtnLoc = (page: any) =>
  page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]').first();

test.describe.configure({ mode: 'serial' });
test.describe('Inbox snooze — TC_INB_037-039 @smoke', () => {
  test.setTimeout(120_000);

  // TC_INB_037 snoozes the open fixture then restores it via archive-toggle.
  // Must run first (serial) so later tests find the fixture in its expected state.
  test('TC_INB_037 Snooze Tomorrow moves open conversation to snoozed state', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    const snoozeBtn = snoozeBtnLoc(page);
    await snoozeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await snoozeBtn.click();

    const tomorrowOpt = page.getByRole('dialog').getByText('Tomorrow', { exact: true });
    await tomorrowOpt.waitFor({ state: 'visible', timeout: 10_000 });
    await tomorrowOpt.click();

    // Snooze does not redirect — the URL stays at /open/ticket/ID.
    // Navigate to the snoozed URL to verify the ticket moved state.
    await page.waitForTimeout(2_000);
    await inboxPage.gotoConversation(conversations.open, 'snoozed');
    const isNowSnoozed = await page
      .locator('[role="textbox"][aria-multiline="true"]').first()
      .isVisible({ timeout: 15_000 }).catch(() => false);

    // ── Restore fixture ──────────────────────────────────────────────────────
    // Archive-toggle: archive snoozed ticket → unarchive = returns to Open state.
    const moreBtn = page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]').last();
    await moreBtn.click();
    await page.getByRole('dialog').getByText('Archive Ticket', { exact: true }).click();
    await page.waitForTimeout(2_000);
    // Ticket is now archived — archive again to restore to Open
    await inboxPage.gotoConversation(conversations.open, 'archived');
    await moreBtn.click();
    await page.getByRole('dialog').getByText('Archive Ticket', { exact: true }).click();
    await page.waitForTimeout(2_000);

    expect(isNowSnoozed).toBe(true);
  });

  test('TC_INB_038 Snooze menu shows Next Week option', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.snoozed, 'snoozed');
    const snoozeBtn = snoozeBtnLoc(page);
    await snoozeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await snoozeBtn.click();
    await expect(
      page.getByRole('dialog').getByText('Next Week', { exact: true })
    ).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
  });

  test('TC_INB_039 Snooze menu shows Custom date option', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.snoozed, 'snoozed');
    const snoozeBtn = snoozeBtnLoc(page);
    await snoozeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await snoozeBtn.click();
    await expect(
      page.getByRole('dialog').getByText('Custom', { exact: true })
    ).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
  });

});
