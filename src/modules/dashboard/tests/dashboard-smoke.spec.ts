import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard smoke — TC_DSH_001–005 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_001 dashboard page loads and URL is /dashboard', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    expect(page.url()).toContain('/dashboard');
    await expect(dashboardPage.loc.welcomeHeading).toBeVisible();
  });

  test('TC_DSH_002 welcome banner shows logged-in username "atfree"', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const headingText = await dashboardPage.loc.welcomeHeading.textContent();
    expect(headingText).toMatch(/atfree/i);
  });

  test('TC_DSH_003 dashboard shows all four main sections', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.workspaceLabel).toBeVisible({ timeout: 15_000 });
    await expect(dashboardPage.loc.projectsHeading).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.assignedHeading).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.liveFeedHeading).toBeVisible({ timeout: 10_000 });
  });

  test('TC_DSH_004 welcome subtitle motivational text is visible', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.welcomeSubtext).toBeVisible({ timeout: 15_000 });
  });

  test('TC_DSH_005 top nav shows project dropdown, search bar, and notification bell', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.projectDropdownBtn).toBeVisible({ timeout: 15_000 });
    await expect(dashboardPage.loc.searchBarTrigger).toBeVisible({ timeout: 10_000 });
    await expect(dashboardPage.loc.notificationBell).toBeVisible({ timeout: 10_000 });
  });
});
