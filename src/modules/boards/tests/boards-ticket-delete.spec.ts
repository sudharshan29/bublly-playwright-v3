import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards — Ticket delete — TC_BRD_DEL_001-002 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_BRD_DEL_001 delete option is available in ticket detail panel', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openFirstTicketCard();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // The delete affordance lives behind a kebab ("more options") icon in the detail
    // panel header — clicking it opens a small floating menu containing "Delete Ticket".
    await boardsPage.loc.detailMoreOptionsBtn.click();
    await expect(boardsPage.loc.deleteTicketMenuItem).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
  });

  test('TC_BRD_DEL_002 adding then deleting a ticket removes it from board', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // Add a disposable ticket to delete. create_ticket intermittently 500s on this QA
    // env, so addTicketAndGetCard retries the create flow before giving up.
    const ticketTitle = `TC_BRD_DEL_002_${Date.now()}`;
    const newCard = await boardsPage.addTicketAndGetCard(ticketTitle);
    await newCard.click();
    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });

    // Delete via kebab menu → "Delete Ticket" → confirm. The underlying update_ticket
    // call reliably 500s yet the deletion is still applied server-side, and the board
    // list is not optimistically updated — so verify removal after a reload, retrying
    // the delete action itself if the ticket is (genuinely) still present.
    // NOTE: uses expect(...).toBeHidden() (not locator.isHidden()) because isHidden()'s
    // `timeout` option is a no-op — it checks the DOM once and returns immediately.
    let removed = false;
    for (let attempt = 1; attempt <= 2 && !removed; attempt++) {
      await boardsPage.deleteCurrentTicketViaDetailPanel();
      await page.waitForTimeout(2_000);
      await boardsPage.gotoBugBoard();
      try {
        await expect(newCard).toBeHidden({ timeout: 10_000 });
        removed = true;
      } catch {
        if (attempt === 1) {
          // Re-open the ticket and try the delete flow again before failing.
          await newCard.click();
          await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
        }
      }
    }

    expect(removed).toBe(true);
  });
});
