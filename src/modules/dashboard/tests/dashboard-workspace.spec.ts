import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard workspace and project — TC_DSH_006–012 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_006 Active Workspace combobox shows current workspace name', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const comboText = await dashboardPage.loc.workspaceCombobox.textContent();
    expect(comboText).toMatch(/Freeplan automation testing/i);
  });

  test('TC_DSH_007 workspace dropdown opens and shows Create New Workspace option', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openWorkspaceDropdown();
    await expect(dashboardPage.loc.workspaceCreateNew).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeDropdown();
  });

  test('TC_DSH_008 workspace dropdown lists at least one existing workspace entry', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openWorkspaceDropdown();
    await page.waitForTimeout(500);
    // The current workspace name appears inside the open dropdown
    const workspaceEntry = page.getByText('Freeplan automation testing', { exact: false });
    await expect(workspaceEntry.first()).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeDropdown();
  });

  test('TC_DSH_009 pressing Escape on workspace dropdown closes it', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openWorkspaceDropdown();
    await expect(dashboardPage.loc.workspaceCreateNew).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeDropdown();
    await expect(dashboardPage.loc.workspaceCreateNew).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_DSH_010 Projects section shows count heading "Projects (N)"', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const headingText = await dashboardPage.loc.projectsHeading.textContent();
    expect(headingText).toMatch(/Projects \(\d+\)/);
  });

  test('TC_DSH_011 project card shows project name and Active status badge', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.projectCardHeading).toBeVisible({ timeout: 10_000 });
    const cardText = await dashboardPage.loc.projectCardHeading.textContent();
    expect(cardText).toMatch(/Freeplan automation testing/i);
    await expect(dashboardPage.loc.projectActiveBadge).toBeVisible({ timeout: 10_000 });
  });

  test('TC_DSH_012 project More options shows Settings and Archive Project choices', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openProjectMoreOptions();
    await expect(dashboardPage.loc.projectSettingsOpt).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.projectArchiveOpt).toBeVisible({ timeout: 5_000 });
    // Close without taking any destructive action
    await dashboardPage.closeContextMenu();
  });
});
