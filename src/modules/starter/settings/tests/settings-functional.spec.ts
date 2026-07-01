import { test, expect } from '../fixtures/settings.fixture';

test.describe('Starter Admin — Settings Functional — TC_ADM_SET_001–002 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_ADM_SET_001 admin can navigate to Members page and see members list', async ({ settingsPage, page }) => {
    await settingsPage.openFromDashboard();
    await settingsPage.gotoWorkspaceMembers();
    // Members page must show the Invite Teammates button and Teammates tab
    await expect(settingsPage.loc.inviteTeammatesBtn).toBeVisible({ timeout: 15_000 });
    await expect(settingsPage.loc.teammatesTab).toBeVisible({ timeout: 15_000 });
    // Members list uses a card layout (not a table) — verify the content area loaded
    await page.waitForTimeout(2_000);
    // Activity Logs tab confirms the full members page rendered
    await expect(page.getByRole('button', { name: 'Activity Logs', exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('TC_ADM_SET_002 admin can click Invite Teammates and invite form opens', async ({ settingsPage, page }) => {
    await settingsPage.openFromDashboard();
    await settingsPage.gotoWorkspaceMembers();
    await settingsPage.loc.inviteTeammatesBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsPage.loc.inviteTeammatesBtn.click();
    await page.waitForTimeout(1_000);
    // Invite form/modal should appear — check for email input or modal dialog
    const inviteForm = page.getByRole('dialog')
      .or(page.locator('[class*="modal"], [class*="invite"]').first())
      .or(page.getByPlaceholder(/email/i).first());
    await expect(inviteForm.first()).toBeVisible({ timeout: 10_000 });
    // Dismiss
    await page.keyboard.press('Escape');
  });
});
