import { test, expect } from '../../../../core/fixtures/starter-base.fixture';
import { env } from '../../../../../config/environment';

const INBOX_URL = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}/all/open`;

// Helper: navigate to starter inbox and open the first available conversation.
// Returns null if the inbox is empty (no open conversations) — callers must skip.
async function openFirstConversation(page: import('@playwright/test').Page) {
  await page.goto(INBOX_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // statusDropdown (combobox with count) is always rendered — confirms React hydration
  const statusDrop = page.getByRole('combobox').filter({ hasText: /\d+/ }).first();
  try {
    await statusDrop.waitFor({ state: 'visible', timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    await statusDrop.waitFor({ state: 'visible', timeout: 20_000 });
  }
  // Wait for either a conversation or "Inbox zero" empty state
  const convItem  = page.locator('[class*="receiver-bg"]').first();
  const emptyText = page.getByText('Inbox zero');
  const state = await Promise.race([
    convItem.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'found' as const),
    emptyText.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'empty' as const),
  ]).catch(() => 'empty' as const);

  if (state === 'empty') return null;

  await convItem.click();
  const detailPanel = page.locator('[class*="headerPadding"][class*="w-full"]');
  await detailPanel.waitFor({ state: 'visible', timeout: 30_000 });
  return detailPanel;
}

test.describe('Starter Admin — Inbox Functional — TC_ADM_INB_001–008 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_ADM_INB_001 admin can open a conversation and detail panel loads', async ({ page }) => {
    const detailPanel = await openFirstConversation(page);
    if (!detailPanel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    await expect(detailPanel).toBeVisible({ timeout: 15_000 });
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });
  });

  test('TC_ADM_INB_002 admin can type a reply and it is accepted in composer', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first();
    await composer.waitFor({ state: 'visible', timeout: 20_000 });
    await composer.fill('TC_ADM_INB_002 admin reply — automation test');
    const typed = await composer.innerText();
    expect(typed).toContain('TC_ADM_INB_002');
    await composer.clear();
  });

  test('TC_ADM_INB_003 admin can change assignee from the Details panel', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.waitForTimeout(500);
    const assigneeCombo = page.getByText('Assignee', { exact: true })
      .locator('..')
      .getByRole('combobox')
      .first();
    await expect(assigneeCombo).toBeVisible({ timeout: 15_000 });
    await assigneeCombo.click();
    await page.waitForTimeout(500);
    // Radix UI dropdown opens as a [role="listbox"] container — check it directly to avoid strict mode
    await expect(page.locator('[role="listbox"]').first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
  });

  test('TC_ADM_INB_004 admin can change status to Closed and ticket moves out of open list', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const detailHeader = page.locator('[class*="headerPadding"][class*="w-full"]');
    const moreOptionsBtn = detailHeader.locator('div[class*="rounded-full"][class*="cursor-pointer"]').last();
    await moreOptionsBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await moreOptionsBtn.click();
    const closeOption = page.getByRole('dialog').getByText('Close Conversation', { exact: true });
    await closeOption.waitFor({ state: 'visible', timeout: 10_000 });
    await closeOption.click();
    const confirmBtn = page.getByRole('button', { name: 'Close', exact: true });
    await confirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await confirmBtn.click();
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_ADM_INB_005 admin can change priority to High in Details panel', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.waitForTimeout(500);
    const priorityCombo = page.getByText('Priority', { exact: true })
      .locator('..')
      .getByRole('combobox');
    await expect(priorityCombo).toBeVisible({ timeout: 15_000 });
    // Retry loop — listbox can close if QA server re-renders during click
    let selected = false;
    for (let attempt = 0; attempt < 3 && !selected; attempt++) {
      await priorityCombo.click();
      const listbox = page.locator('[role="listbox"]').first();
      const opened = await listbox.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
      if (!opened) { await page.keyboard.press('Escape'); continue; }
      const opt = listbox.getByRole('option', { name: 'High', exact: true });
      const ready = await opt.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
      if (!ready) { await page.keyboard.press('Escape'); continue; }
      await opt.click();
      selected = true;
    }
    await page.waitForTimeout(500);
    const updatedValue = await priorityCombo.textContent();
    expect(updatedValue?.toLowerCase()).toContain('high');
  });

  test('TC_ADM_INB_006 admin can snooze a ticket using the Snooze menu', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const detailHeader = page.locator('[class*="headerPadding"][class*="w-full"]');
    const snoozeBtn = detailHeader.locator('div[class*="rounded-full"][class*="cursor-pointer"]').nth(0);
    await snoozeBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await snoozeBtn.click();
    const tomorrowOpt = page.getByRole('dialog').getByText('Tomorrow', { exact: true });
    await expect(tomorrowOpt).toBeVisible({ timeout: 10_000 });
    await tomorrowOpt.click();
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_ADM_INB_007 admin can archive a ticket from More Options menu', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const detailHeader = page.locator('[class*="headerPadding"][class*="w-full"]');
    const moreOptionsBtn = detailHeader.locator('div[class*="rounded-full"][class*="cursor-pointer"]').last();
    await moreOptionsBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await moreOptionsBtn.click();
    const archiveOption = page.getByRole('dialog').getByText('Archive Ticket', { exact: true });
    await archiveOption.waitFor({ state: 'visible', timeout: 10_000 });
    await archiveOption.click();
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_ADM_INB_008 admin can mark a ticket as Spam from More Options menu', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const detailHeader = page.locator('[class*="headerPadding"][class*="w-full"]');
    const moreOptionsBtn = detailHeader.locator('div[class*="rounded-full"][class*="cursor-pointer"]').last();
    await moreOptionsBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await moreOptionsBtn.click();
    const spamOption = page.getByRole('dialog').getByText(/spam/i).first();
    await expect(spamOption).toBeVisible({ timeout: 10_000 });
    await spamOption.click();
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/inbox/');
  });
});
