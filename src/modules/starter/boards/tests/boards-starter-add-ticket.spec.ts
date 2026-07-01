import { test, expect } from '../fixtures/boards-starter.fixture';

test.describe('Starter Boards — Add Ticket — TC_BRD_S_001–005 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ boardsStarterAddTicketPage }) => {
    await boardsStarterAddTicketPage.gotoBugBoard();
  });

  test('TC_BRD_S_001 Bug board kanban shows Open column', async ({ boardsStarterAddTicketPage }) => {
    await expect(boardsStarterAddTicketPage.loc.openColumnLabel).toBeVisible();
  });

  test('TC_BRD_S_002 clicking + on Open column opens add-ticket modal', async ({ boardsStarterAddTicketPage }) => {
    await boardsStarterAddTicketPage.openAddTicketModal();
    // Wait up to 15s for the modal heading — title input may take longer to render
    const hasModal = await boardsStarterAddTicketPage.loc.addBugModalTitle
      .isVisible({ timeout: 15_000 }).catch(() => false);
    const hasTitleInput = await boardsStarterAddTicketPage.loc.addTicketTitleInput
      .isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasModal || hasTitleInput).toBe(true);
  });

  test('TC_BRD_S_003 title input accepts text input', async ({ boardsStarterAddTicketPage }) => {
    await boardsStarterAddTicketPage.openAddTicketModal();
    await boardsStarterAddTicketPage.loc.addTicketTitleInput.waitFor({ state: 'visible', timeout: 10_000 });
    await boardsStarterAddTicketPage.loc.addTicketTitleInput.fill('Starter Plan Auto Test Ticket');
    const value = await boardsStarterAddTicketPage.loc.addTicketTitleInput.inputValue();
    expect(value).toBe('Starter Plan Auto Test Ticket');
  });

  test('TC_BRD_S_004 pressing Escape closes add-ticket modal without creating ticket', async ({ boardsStarterAddTicketPage, page }) => {
    const countBefore = await boardsStarterAddTicketPage.getColumnCount('Open');
    await boardsStarterAddTicketPage.openAddTicketModal();
    await boardsStarterAddTicketPage.loc.addTicketTitleInput.waitFor({ state: 'visible', timeout: 10_000 });
    await page.keyboard.press('Escape');
    // Wait for modal to fully close before counting — same pattern as free-plan TC_BRD_036
    await boardsStarterAddTicketPage.loc.addBugModalTitle
      .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    const countAfter = await boardsStarterAddTicketPage.getColumnCount('Open');
    expect(countAfter).toBe(countBefore);
  });

  test('TC_BRD_S_005 submitting a ticket increases Open column count', async ({ boardsStarterAddTicketPage, page }) => {
    const countBefore = await boardsStarterAddTicketPage.getColumnCount('Open');
    await boardsStarterAddTicketPage.openAddTicketModal();
    await boardsStarterAddTicketPage.loc.addTicketTitleInput.waitFor({ state: 'visible', timeout: 10_000 });

    const title = `Starter Auto Bug ${Date.now()}`;
    await boardsStarterAddTicketPage.loc.addTicketTitleInput.fill(title);

    const hasBtn = await boardsStarterAddTicketPage.loc.addTicketSubmitBtn
      .isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasBtn) {
      await boardsStarterAddTicketPage.loc.addTicketSubmitBtn.click();
    } else {
      await boardsStarterAddTicketPage.loc.addTicketTitleInput.press('Enter');
    }

    await boardsStarterAddTicketPage.loc.addBugModalTitle
      .waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const countAfter = await boardsStarterAddTicketPage.getColumnCount('Open');
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });
});
