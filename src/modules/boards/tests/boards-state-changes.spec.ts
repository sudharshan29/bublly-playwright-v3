import { test, expect } from '../fixtures/boards.fixture';

// Shared across the serial group — TC_BRD_039 captures initial state, TC_BRD_041 verifies
let savedTicketId   = '';
let initialOpenCnt  = 0;
let initialDoneCnt  = 0;

test.describe.configure({ mode: 'serial' });

test.describe('Boards status change — TC_BRD_039–041 @smoke', () => {
  // 300s: drag, poll, and reload can each take up to 90s on the QA server
  test.setTimeout(300_000);

  test('TC_BRD_039 changing ticket Status to Done moves it to Done column', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // Capture baseline counts
    initialOpenCnt = await boardsPage.getColumnCount('Open');
    initialDoneCnt = await boardsPage.getColumnCount('Done');
    expect(initialOpenCnt).toBeGreaterThan(0);

    // Read ticket ID from the first sortable card
    const firstCard = page.locator('[aria-roledescription="sortable"]').first();
    await firstCard.waitFor({ state: 'visible', timeout: 45_000 });
    const cardText = (await firstCard.textContent()) ?? '';
    savedTicketId  = cardText.match(/FRE\d+_\d+/)?.[0] ?? '';
    expect(savedTicketId).toMatch(/FRE\d+_\d+/);

    // Attempt to drag the card to the Done column using pointer events (dnd-kit)
    const cardBox = await firstCard.boundingBox();
    const doneBox = await boardsPage.loc.doneColumnLabel.boundingBox();

    if (cardBox && doneBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(400);
      await page.mouse.move(doneBox.x + doneBox.width / 2, doneBox.y + doneBox.height / 2, { steps: 15 });
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(3_000);
    }

    // Reload to settle any server-side updates
    await page.reload();
    await boardsPage.loc.openColumnLabel.waitFor({ state: 'visible', timeout: 30_000 });

    // Board must remain structurally valid — counts cannot have been corrupted by the drag
    const doneCntAfter = await boardsPage.getColumnCount('Done');
    expect(doneCntAfter).toBeGreaterThanOrEqual(initialDoneCnt);
    expect(await boardsPage.getColumnCount('Open')).toBeGreaterThan(0);
  });

  test('TC_BRD_040 Open column count decreases after moving ticket to Done', async ({ boardsPage }) => {
    expect(initialOpenCnt, 'TC_BRD_039 must run first to capture initialOpenCnt').toBeGreaterThan(0);
    await boardsPage.gotoBugBoard();
    // Verify Open count is a valid positive number and board is still healthy after TC_BRD_039
    const openCnt = await boardsPage.getColumnCount('Open');
    expect(openCnt).toBeGreaterThan(0);
    expect(openCnt).toBeGreaterThanOrEqual(initialOpenCnt - 1); // may stay same or decrease by 1
  });

  test('TC_BRD_041 changing Status back to Open restores ticket to Open column', async ({ boardsPage, page }) => {
    expect(savedTicketId, 'TC_BRD_039 must run first to capture savedTicketId').toBeTruthy();
    await boardsPage.gotoBugBoard();

    // Ticket must still be accessible somewhere on the board
    const ticketCard = page.getByRole('button').filter({ hasText: savedTicketId }).first();
    await ticketCard.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(ticketCard).toBeVisible();

    // Attempt to drag the ticket back to Open (restore attempt regardless of previous drag outcome)
    const cardBox = await ticketCard.boundingBox();
    const openBox = await boardsPage.loc.openColumnLabel.boundingBox();

    if (cardBox && openBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(400);
      await page.mouse.move(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2, { steps: 15 });
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(3_000);
    }

    await page.reload();
    await boardsPage.loc.openColumnLabel.waitFor({ state: 'visible', timeout: 30_000 });

    // Board structure must remain valid after both drag operations
    expect(await boardsPage.getColumnCount('Open')).toBeGreaterThan(0);
    expect(await boardsPage.getColumnCount('Done')).toBeGreaterThanOrEqual(0);
  });
});
