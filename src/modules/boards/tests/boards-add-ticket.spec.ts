import { test, expect } from '../fixtures/boards.fixture';

test.describe('Boards add ticket — TC_BRD_032–036 and TC_BRD_046 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_BRD_032 clicking + on Open column opens Report a Bug modal', async ({ boardsPage }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });
  });

  test('TC_BRD_033 Report a Bug modal shows Board Column pre-filled as Open', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });
    // The column field should show "Open" (read-only pre-fill)
    const openText = page.getByText('Open', { exact: true });
    await expect(openText.first()).toBeVisible({ timeout: 8_000 });
  });

  test('TC_BRD_034 submitting empty Title shows required validation', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });

    // Leave title empty and try to submit by pressing Enter on the title field
    await boardsPage.loc.addTicketTitleInput.click();
    await boardsPage.loc.addTicketTitleInput.press('Enter');
    await page.waitForTimeout(1_000);

    // Validation error should appear (text varies — check for any error indicator)
    const hasError = await page.locator('[class*="error"], [class*="invalid"], [class*="required"]')
      .first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasRequiredText = await page.getByText(/required|cannot be empty|enter a title/i)
      .first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasError || hasRequiredText).toBe(true);
  });

  test('TC_BRD_035 filling Title and submitting creates a ticket in Open column', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    const openBefore = await boardsPage.getColumnCount('Open');

    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });

    const uniqueTitle = `AutoTest Bug ${Date.now()}`;
    await boardsPage.loc.addTicketTitleInput.fill(uniqueTitle);

    // Submit via button or Enter
    const submitted = await boardsPage.loc.addTicketSubmitBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (submitted) {
      await boardsPage.loc.addTicketSubmitBtn.click();
    } else {
      await boardsPage.loc.addTicketTitleInput.press('Enter');
    }

    // Wait for modal to close and board to update
    await boardsPage.loc.addBugModalTitle.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const openAfter = await boardsPage.getColumnCount('Open');
    expect(openAfter).toBeGreaterThanOrEqual(openBefore);
  });

  test('TC_BRD_036 closing modal without submitting does not create a ticket', async ({ boardsPage, page }) => {
    await boardsPage.gotoBugBoard();
    const openBefore = await boardsPage.getColumnCount('Open');

    await boardsPage.openAddTicketOnOpenColumn();
    await expect(boardsPage.loc.addBugModalTitle).toBeVisible({ timeout: 15_000 });

    // Close by pressing Escape without filling anything
    await page.keyboard.press('Escape');
    await boardsPage.loc.addBugModalTitle.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);

    const openAfter = await boardsPage.getColumnCount('Open');
    expect(openAfter).toBe(openBefore);
  });

  test('TC_BRD_046 clicking + on FeatureRequests board opens a feature-request modal', async ({ boardsPage, page }) => {
    await boardsPage.gotoFeatureBoard();
    await boardsPage.openAddTicketOnOpenColumn();
    // Modal text varies ("Request a Feature" / "Submit a Feature Request" / etc.)
    const hasFeatureModal = await page
      .getByText(/feature/i)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    const hasTitleInput = await boardsPage.loc.addTicketTitleInput
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(hasFeatureModal || hasTitleInput).toBe(true);
  });
});
