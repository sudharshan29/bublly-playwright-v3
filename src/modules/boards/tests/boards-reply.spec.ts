import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards detail panel reply — TC_BRD_064 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_BRD_064 reply composer in board detail panel accepts text input', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();

    // The board detail shows a ProseMirror editor at the bottom of the thread pane.
    // ProseMirror uses a CSS ::before pseudo-element for "Start Conversation..." — NOT
    // a real HTML placeholder attribute, so getByPlaceholder() fails. The composer lives
    // in the LEFT thread pane, not inside the right-side detailPanel (details section).
    // Target by role=textbox + aria-multiline (same pattern as inbox ProseMirror editor).
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first()
      .or(page.locator('[contenteditable="true"]').first());
    await composer.waitFor({ state: 'visible', timeout: 20_000 });

    const replyText = 'TC_BRD_064 board detail reply — automation test';
    await composer.fill(replyText);
    await page.waitForTimeout(300);

    // Verify text was typed into the composer
    const value = await composer.inputValue().catch(async () => composer.innerText());
    const typed  = typeof value === 'string' ? value : await value;
    expect(typed).toContain('TC_BRD_064');

    // Clear without sending — avoid polluting board ticket data
    await composer.clear();
    await boardsPage.closeDetailPanel();
  });

  test('TC_BRD_065 Assignee dropdown in board detail panel opens and shows agent options', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();

    // Assignee label must be visible in the detail panel
    await expect(boardsPage.loc.detailAssignee).toBeVisible({ timeout: 10_000 });

    // The combobox sits in the same row as the Assignee label
    const assigneeCombo = boardsPage.loc.detailPanel
      .getByText('Assignee', { exact: true })
      .locator('..')
      .getByRole('combobox')
      .first();

    await assigneeCombo.waitFor({ state: 'visible', timeout: 10_000 });
    await assigneeCombo.click();
    await page.waitForTimeout(500);

    // At least one option (agent or "Unassigned") must appear
    const options = page.getByRole('option').or(page.getByRole('listbox')).first();
    await expect(options).toBeVisible({ timeout: 8_000 });

    // Dismiss without making a change
    await page.keyboard.press('Escape');
    await boardsPage.closeDetailPanel();
  });
});
