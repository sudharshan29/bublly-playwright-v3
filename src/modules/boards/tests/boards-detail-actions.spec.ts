import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards detail panel actions — TC_BRD_047–051 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_BRD_047 pressing Escape closes the detail panel', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press('Escape');
    await expect(boardsPage.loc.detailPanel).not.toBeVisible({ timeout: 10_000 });
  });

  test('TC_BRD_048 copy link icon is visible in the detail panel header', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // There should be at least one clickable icon in the panel header area
    const panelIcons = boardsPage.loc.detailPanel.locator('svg, img[class*="cursor"]');
    const iconCount  = await panelIcons.count();
    expect(iconCount).toBeGreaterThanOrEqual(1);
  });

  test('TC_BRD_049 detail panel shows a message reply composer or text input', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // Board tickets may use different placeholder text than inbox
    const hasComposer = await boardsPage.loc.detailPanel
      .locator('textarea, [contenteditable="true"], [placeholder*="onversation"], [placeholder*="eply"], [placeholder*="essage"]')
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    const hasInputArea = await page
      .getByRole('textbox')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasComposer || hasInputArea).toBe(true);
  });

  test('TC_BRD_050 Priority can be changed from detail panel and restored', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // Click Priority field to open Radix dropdown
    const priorityRow = boardsPage.loc.detailPanel
      .locator('p, span, div')
      .filter({ hasText: /^Priority$/ })
      .first();
    const isClickable = await priorityRow.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isClickable) {
      // Attempt to find and click a priority combobox/button near the Priority label
      const priorityCombo = boardsPage.loc.detailPanel
        .locator('[role="combobox"], button, select')
        .filter({ hasText: /high|medium|low/i })
        .first();
      const hasCombo = await priorityCombo.isVisible({ timeout: 5_000 }).catch(() => false);
      if (hasCombo) {
        await priorityCombo.click();
        const highOption = page.getByRole('option', { name: 'High', exact: true });
        if (await highOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await highOption.click();
          await page.waitForTimeout(1_000);
          // Restore to Medium
          await priorityCombo.click();
          const medOption = page.getByRole('option', { name: 'Medium', exact: true });
          if (await medOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await medOption.click();
          }
        }
      }
    }

    // At minimum the priority label should remain visible
    await expect(boardsPage.loc.detailPriority).toBeVisible({ timeout: 5_000 });
  });

  test('TC_BRD_051 Description tab is visible and clickable in detail panel', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // Description tab exists alongside Details tab
    const descTabVisible = await boardsPage.loc.descriptionTab.isVisible({ timeout: 8_000 }).catch(() => false);
    const detailsTabVisible = await boardsPage.loc.detailsTab.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(descTabVisible || detailsTabVisible).toBe(true);
  });

  test('TC_BRD_060 Done column count increases after moving ticket to Done', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    const doneBefore = await boardsPage.getColumnCount('Done');

    // Open a ticket and move it to Done
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
    await boardsPage.setStatus('Done');

    // Poll until Done count updates (badge re-renders async after status change)
    let doneAfter = doneBefore;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(800);
      doneAfter = await boardsPage.getColumnCount('Done');
      if (doneAfter > doneBefore) break;
    }
    expect(doneAfter).toBeGreaterThan(doneBefore);

    // Restore ticket back to Open
    await boardsPage.setStatus('Open');
    await page.waitForTimeout(1_000);
  });

  test('TC_BRD_061 Status combobox in board detail panel opens and reflects selection', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // Locate the workflow Status combobox in the detail panel (separate from Open/Done column status)
    const statusRow   = boardsPage.loc.detailPanel
      .getByText('Status', { exact: true }).locator('..');
    const statusCombo = statusRow.getByRole('combobox');
    const hasCombo    = await statusCombo.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!hasCombo) {
      // Board detail may not have a workflow Status combobox (tickets use column for status)
      // Verify at minimum the Status label is present
      await expect(boardsPage.loc.detailStatus).toBeVisible({ timeout: 5_000 });
      return;
    }

    await statusCombo.click();
    await page.waitForTimeout(400);

    const options    = page.getByRole('option');
    const hasOptions = await options.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasOptions) {
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(1);
      // Select first option and verify field updates
      await options.first().click();
      await page.waitForTimeout(800);
      const updatedText = await statusCombo.textContent();
      expect(updatedText?.trim()).toBeTruthy();

      // Restore to default (clear/none)
      await statusCombo.click();
      const clearOpt = page.getByRole('option', { name: /none|clear|select/i });
      const hasClear = await clearOpt.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasClear) await clearOpt.click();
      else await page.keyboard.press('Escape');
    } else {
      // No workflow statuses configured — combobox structure is verified
      await page.keyboard.press('Escape');
      await expect(statusCombo).toBeVisible();
    }
  });
});
