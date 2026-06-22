import { test, expect } from '../fixtures/boards.fixture';

// Serial: TC_BRD_039 moves a ticket to Done; TC_BRD_040 checks count; TC_BRD_041 restores.
// Module-level state shared across the serial group.
let savedTicketId   = '';
let initialOpenCnt  = 0;
let initialDoneCnt  = 0;

test.describe.configure({ mode: 'serial' });

test.describe('Boards status change — TC_BRD_039–041 @smoke', () => {
  // 300s: each setStatus() waits up to 90s for badge + 90s for option on slow QA server
  test.setTimeout(300_000);

  test('TC_BRD_039 changing ticket Status to Done moves it to Done column', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // Capture baseline counts
    initialOpenCnt = await boardsPage.getColumnCount('Open');
    initialDoneCnt = await boardsPage.getColumnCount('Done');

    // Open the first available ticket in the Open column
    savedTicketId = await boardsPage.openFirstTicketCard();
    expect(savedTicketId).toMatch(/FRE\d+_\d+/);

    // Change status from Open → Done
    await boardsPage.setStatus('Done');

    // Close the panel and reload to ensure server-side update is reflected
    await boardsPage.closeDetailPanel();
    await page.reload();
    await boardsPage.loc.openColumnLabel.waitFor({ state: 'visible', timeout: 30_000 });

    // Verify Done count increased
    const doneCntAfter = await boardsPage.getColumnCount('Done');
    expect(doneCntAfter).toBeGreaterThanOrEqual(initialDoneCnt + 1);
  });

  test('TC_BRD_040 Open column count decreases after moving ticket to Done', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    const openCntNow = await boardsPage.getColumnCount('Open');
    // Open count should have dropped by at least 1 from baseline
    expect(openCntNow).toBeLessThanOrEqual(initialOpenCnt - 1);
  });

  test('TC_BRD_041 changing Status back to Open restores ticket to Open column', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // The ticket is now in Done — open it from there
    // (cards in Done are the same button format)
    await boardsPage.openTicketCard(savedTicketId);

    // Change status Done → Open (restore)
    await boardsPage.setStatus('Open');

    await boardsPage.closeDetailPanel();
    await page.reload();
    await boardsPage.loc.openColumnLabel.waitFor({ state: 'visible', timeout: 30_000 });

    // Open count should be restored to original baseline
    const openCntRestored = await boardsPage.getColumnCount('Open');
    expect(openCntRestored).toBeGreaterThanOrEqual(initialOpenCnt);
  });
});
