import { test, expect } from '../../../../core/fixtures/starter-base.fixture';
import { env } from '../../../../../config/environment';

const BOARD_URL = `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`;

// Helper: navigate to starter bug board and open the first ticket card
async function openFirstBoardTicket(page: import('@playwright/test').Page) {
  await page.goto(BOARD_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // Wait for kanban board to load
  const openCol = page.locator('p').filter({ hasText: /^Open$/ }).first();
  await openCol.waitFor({ state: 'visible', timeout: 60_000 });
  // Kanban ticket cards have aria-roledescription="sortable" — unique to draggable cards
  const card = page.locator('[aria-roledescription="sortable"]').first();
  await card.waitFor({ state: 'visible', timeout: 15_000 });
  await card.click();
  // Detail panel opens on the right
  const detailPanel = page.locator('[class*="headerPadding"][class*="w-full"]')
    .or(page.locator('[class*="detail-panel"], [class*="ticket-detail"]').first());
  await detailPanel.first().waitFor({ state: 'visible', timeout: 45_000 });
  return detailPanel.first();
}

test.describe('Starter Admin — Boards Functional — TC_ADM_BRD_001–003 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_ADM_BRD_001 admin can click a board ticket and detail panel opens', async ({ page }) => {
    const detailPanel = await openFirstBoardTicket(page);
    await expect(detailPanel).toBeVisible({ timeout: 15_000 });
    // Reply composer confirms ticket thread loaded
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first()
      .or(page.locator('[contenteditable="true"]').first());
    await expect(composer).toBeVisible({ timeout: 20_000 });
  });

  test('TC_ADM_BRD_002 admin can type a reply in board ticket composer', async ({ page }) => {
    await openFirstBoardTicket(page);
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first()
      .or(page.locator('[contenteditable="true"]').first());
    await composer.waitFor({ state: 'visible', timeout: 20_000 });
    await composer.fill('TC_ADM_BRD_002 starter admin board reply — automation test');
    const typed = await composer.innerText();
    expect(typed).toContain('TC_ADM_BRD_002');
    // Clear without sending
    await composer.clear();
  });

  test('TC_ADM_BRD_003 admin can change board ticket status from Open to Done', async ({ page }) => {
    await openFirstBoardTicket(page);
    // Status is a Radix UI combobox in the Details panel — scoped by its label row
    const statusCombo = page.getByText('Status', { exact: true })
      .locator('..')
      .getByRole('combobox');
    await statusCombo.waitFor({ state: 'visible', timeout: 20_000 });
    const currentText = (await statusCombo.textContent())?.trim() ?? '';
    const targetStatus = currentText.toLowerCase().includes('done') ? 'Open' : 'Done';
    await statusCombo.click();
    await page.waitForTimeout(500);
    const targetOption = page.getByRole('option', { name: new RegExp(targetStatus, 'i') }).first();
    await targetOption.waitFor({ state: 'visible', timeout: 10_000 });
    await targetOption.click();
    // Poll until combobox reflects the new status — QA API can take 2-3s to respond
    await expect.poll(
      async () => ((await statusCombo.textContent())?.trim() ?? '').toLowerCase(),
      { timeout: 10_000, intervals: [500, 1_000, 2_000] }
    ).toContain(targetStatus.toLowerCase());
    // Restore original status — only if currentText was a real option, not the placeholder
    await statusCombo.click();
    await page.waitForTimeout(500);
    if (/select/i.test(currentText) || currentText === '') {
      // Status was unset — just close the dropdown without selecting
      await page.keyboard.press('Escape');
    } else {
      const restoreOption = page.getByRole('option', { name: new RegExp(currentText, 'i') }).first();
      await restoreOption.waitFor({ state: 'visible', timeout: 10_000 });
      await restoreOption.click().catch((e: Error) => console.warn('TC_ADM_BRD_003 restore click failed:', e.message));
    }
  });
});
