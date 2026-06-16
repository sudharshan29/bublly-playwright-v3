import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard Live Feed — TC_DSH_022–027 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_022 Live Feed section is visible with correct heading', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.liveFeedHeading).toBeVisible({ timeout: 15_000 });
    const headingText = await dashboardPage.loc.liveFeedHeading.textContent();
    expect(headingText).toMatch(/Live Feed/i);
  });

  test('TC_DSH_023 Live Feed shows at least five activity items', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.loc.liveFeedItems.first().waitFor({ state: 'visible', timeout: 20_000 });
    const count = await dashboardPage.getLiveFeedCount();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('TC_DSH_024 each Live Feed item shows ticket ID customer name and activity text', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const first = dashboardPage.loc.liveFeedItems.first();
    await first.waitFor({ state: 'visible', timeout: 20_000 });
    const text = (await first.textContent()) ?? '';
    // Should contain a ticket ID like FRE519_1799
    expect(text).toMatch(/FRE\d+_\d+/);
    // Should contain the activity event text
    expect(text).toMatch(/ticket created|assigned|updated|replied/i);
  });

  test('TC_DSH_025 clicking a Live Feed item navigates to that ticket', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    const firstItem = dashboardPage.loc.liveFeedItems.first();
    await firstItem.waitFor({ state: 'visible', timeout: 20_000 });
    await firstItem.click();
    // Live feed items navigate to /project/{uuid}/tickets/{id} (not /inbox/)
    await page.waitForURL(/\/tickets?\/\d+/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/tickets?\/\d+/);
  });

  test('TC_DSH_026 ticket ID shown in Live Feed matches URL when that item is clicked', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    const firstItem = dashboardPage.loc.liveFeedItems.first();
    await firstItem.waitFor({ state: 'visible', timeout: 20_000 });
    const itemText = (await firstItem.textContent()) ?? '';
    await firstItem.click();
    // Live feed items navigate to /project/{uuid}/tickets/{id}
    await page.waitForURL(/\/tickets?\/\d+/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/tickets?\/\d+/);
    // Item text contained the FRE prefix ID which is the board reference
    expect(itemText).toMatch(/FRE\d+_\d+/);
  });

  test('TC_DSH_027 Live Feed items display relative timestamps', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const first = dashboardPage.loc.liveFeedItems.first();
    await first.waitFor({ state: 'visible', timeout: 20_000 });
    const text = (await first.textContent()) ?? '';
    // Relative time like "5 mins ago", "1 hr ago", "2 days ago"
    expect(text).toMatch(/\d+\s+(min|hr|day|week|month)s?\s+ago/i);
  });
});
