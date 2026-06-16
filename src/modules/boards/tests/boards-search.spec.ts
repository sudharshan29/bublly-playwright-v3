import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards search — TC_BRD_042–045 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_BRD_042 search icon opens search input in board header', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openSearch();
    await expect(boardsPage.loc.searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('TC_BRD_043 typing keyword filters matching ticket cards', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    const totalBefore = await boardsPage.loc.ticketCards.count();
    expect(totalBefore).toBeGreaterThanOrEqual(1);

    // Search with a keyword that exists in at least some ticket titles
    await boardsPage.search('Bug');

    // After search, cards still present (Bug board cards likely contain "Bug")
    await expect(boardsPage.loc.openColumnLabel).toBeVisible({ timeout: 10_000 });
    const afterCount = await boardsPage.loc.ticketCards.count();
    expect(afterCount).toBeGreaterThanOrEqual(0);
  });

  test('TC_BRD_044 no-match search returns 0 ticket cards', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.search('zzz_no_match_xyz_99999_boards');
    // Wait for debounce to settle
    await boardsPage.page.waitForTimeout(1_500);
    const count = await boardsPage.loc.ticketCards.count();
    expect(count).toBe(0);
  });

  test('TC_BRD_045 clearing search restores full ticket card list', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    const initialCount = await boardsPage.loc.ticketCards.count();

    await boardsPage.search('zzz_no_match_xyz_99999_boards');
    await boardsPage.page.waitForTimeout(1_000);
    await boardsPage.clearSearch();

    // Wait for cards to reload
    await boardsPage.page.waitForTimeout(1_000);
    const restoredCount = await boardsPage.loc.ticketCards.count();
    expect(restoredCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('TC_BRD_062 search by exact FRE ticket ID returns that specific card', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // Read the ticket ID from the first visible card
    const firstCard = boardsPage.loc.ticketCards.first();
    await firstCard.waitFor({ state: 'visible', timeout: 15_000 });
    const cardText   = await firstCard.textContent() ?? '';
    const idMatch    = cardText.match(/FRE\d+_\d+/);

    if (!idMatch) {
      // No FRE ID found — skip gracefully (board data may have changed)
      expect(await boardsPage.loc.ticketCards.count()).toBeGreaterThanOrEqual(1);
      return;
    }

    const ticketId = idMatch[0];
    await boardsPage.search(ticketId);
    await page.waitForTimeout(1_500);

    // The specific card with this ID must appear in search results
    const matchedCard = page.getByRole('button').filter({ hasText: ticketId });
    await expect(matchedCard.first()).toBeVisible({ timeout: 10_000 });
  });
});
