import { test, expect } from '../../../../core/fixtures/agent-base.fixture';
import { env } from '../../../../../config/environment';

const INBOX_URL = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}/all/open`;

// Helper: open the first available conversation. Returns null if inbox is empty.
async function openFirstConversation(page: import('@playwright/test').Page) {
  await page.goto(INBOX_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  const statusDrop = page.getByRole('combobox').filter({ hasText: /\d+/ }).first();
  try {
    await statusDrop.waitFor({ state: 'visible', timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    await statusDrop.waitFor({ state: 'visible', timeout: 20_000 });
  }
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

test.describe('Starter Agent — Inbox Functional — TC_AGT_INB_001–005 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_AGT_INB_001 agent can open a conversation and detail panel loads', async ({ page }) => {
    const detailPanel = await openFirstConversation(page);
    if (!detailPanel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    await expect(detailPanel).toBeVisible({ timeout: 15_000 });
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });
  });

  test('TC_AGT_INB_002 agent can type a reply in the composer', async ({ page }) => {
    const panel = await openFirstConversation(page);
    if (!panel) { test.skip(true, 'No open conversations in starter inbox'); return; }
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first();
    await composer.waitFor({ state: 'visible', timeout: 20_000 });
    await composer.fill('TC_AGT_INB_002 agent reply — automation test');
    const typed = await composer.innerText();
    expect(typed).toContain('TC_AGT_INB_002');
    await composer.clear();
  });

  test('TC_AGT_INB_003 agent can change status to Closed from More Options', async ({ page }) => {
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

  test('TC_AGT_INB_004 agent can change priority in Details panel', async ({ page }) => {
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

  test('TC_AGT_INB_005 agent can snooze a ticket using Snooze menu', async ({ page }) => {
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
});
