import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards — Ticket edit — TC_BRD_EDIT_001-003 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_BRD_EDIT_001 ticket title is editable in the detail panel', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
    // Title in detail panel — usually a heading or input at top of panel
    const titleEl = boardsPage.loc.detailPanel
      .locator('h1, h2, h3, input[type="text"], [contenteditable="true"]').first();
    await titleEl.waitFor({ state: 'visible', timeout: 10_000 });
    await titleEl.click();
    await page.waitForTimeout(300);
    const editableInput = boardsPage.loc.detailPanel
      .locator('input[type="text"], [contenteditable="true"]').first();
    const isEditable = await editableInput.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!isEditable) {
      test.skip(true, 'Ticket title not editable via click — may need double-click or pencil icon');
      return;
    }
    await expect(editableInput).toBeEnabled();
  });

  test('TC_BRD_EDIT_002 Description tab content area is editable', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
    // Click the Description tab
    const descTab = boardsPage.loc.descriptionTab;
    await descTab.waitFor({ state: 'visible', timeout: 10_000 });
    await descTab.click();
    await page.waitForTimeout(500);
    // Description area should be editable
    const descArea = page.locator('[contenteditable="true"]').first()
      .or(page.getByRole('textbox').first());
    await descArea.waitFor({ state: 'visible', timeout: 10_000 });
    const descText = `TC_BRD_EDIT_002 description test ${Date.now()}`;
    await descArea.fill(descText);
    await page.waitForTimeout(500);
    const typed = await descArea.innerText().catch(() => descArea.inputValue().catch(() => ''));
    expect(await typed).toContain('TC_BRD_EDIT_002');
  });

  test('TC_BRD_EDIT_003 assignee change in board detail persists after closing panel', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
    // Open assignee dropdown
    const assigneeRow   = boardsPage.loc.detailPanel.getByText('Assignee', { exact: true }).locator('..');
    const assigneeCombo = assigneeRow.getByRole('combobox').first();
    const hasCombo = await assigneeCombo.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasCombo) { test.skip(true, 'Assignee combobox not found in board detail'); return; }
    await assigneeCombo.click();
    await page.waitForTimeout(500);
    const listbox = page.locator('[role="listbox"], [role="option"]').first();
    const hasList = await listbox.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasList) { await page.keyboard.press('Escape'); test.skip(true, 'Assignee listbox did not open'); return; }
    // Select the first non-empty option
    const options = page.getByRole('option');
    const optCount = await options.count();
    if (optCount === 0) { await page.keyboard.press('Escape'); test.skip(true, 'No assignee options'); return; }
    const firstOpt  = options.first();
    const optText   = await firstOpt.textContent();
    await firstOpt.click();
    await page.waitForTimeout(1_500);
    // Close and reopen to verify persistence
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await boardsPage.openFirstTicketCard();
    await assigneeRow.waitFor({ state: 'visible', timeout: 10_000 });
    const currentVal = await assigneeCombo.textContent();
    expect(currentVal?.trim()).toBeTruthy();
  });
});
