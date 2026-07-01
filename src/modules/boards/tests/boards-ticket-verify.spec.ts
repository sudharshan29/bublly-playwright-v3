import { test, expect } from '../fixtures/boards.fixture';

test.describe.configure({ mode: 'serial' });

// Shared title across both serial tests — set by TC_BRD_056, consumed by TC_BRD_057
let sharedTitle = '';

test.describe('Boards ticket create and verify — TC_BRD_056-057 @smoke', () => {
  test.setTimeout(180_000);

  test('TC_BRD_056 created ticket appears as a card with the exact title on the board', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    const uniqueTitle = `AutoVerify_${Date.now()}`;
    sharedTitle = uniqueTitle;

    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });
    await boardsPage.loc.addTicketTitleInput.fill(uniqueTitle);

    const hasSubmitBtn = await boardsPage.loc.addTicketSubmitBtn
      .isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasSubmitBtn) {
      await boardsPage.loc.addTicketSubmitBtn.click();
    } else {
      await boardsPage.loc.addTicketTitleInput.press('Enter');
    }

    await boardsPage.loc.addBugModalTitle
      .waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

    // Reload the board — forces a fresh fetch from the server so the newly created
    // ticket is included in both the column and search index before we query it.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await boardsPage.loc.openColumnLabel.waitFor({ state: 'visible', timeout: 30_000 });

    // Use board search to locate the freshly created card by its unique title
    await boardsPage.search(uniqueTitle);
    await page.waitForTimeout(2_000);

    const card = page.getByRole('button').filter({ hasText: uniqueTitle });
    // Poll — QA server may take several seconds to index newly created tickets
    await expect.poll(
      () => card.first().isVisible(),
      { timeout: 60_000, intervals: [2_000, 3_000, 5_000] }
    ).toBeTruthy();
  });

  test('TC_BRD_057 clicking the newly created ticket card opens its detail panel', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();

    // The ticket from TC_BRD_056 is persisted on the QA server — find it via search
    await boardsPage.search(sharedTitle);
    await page.waitForTimeout(1_500);

    const card = page.getByRole('button').filter({ hasText: sharedTitle });
    await card.first().waitFor({ state: 'visible', timeout: 15_000 });
    await card.first().click();

    await expect(boardsPage.loc.detailPanel).toBeVisible({ timeout: 15_000 });
    await expect(boardsPage.loc.detailTicketId).toBeVisible({ timeout: 10_000 });
  });
});
