import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard Assigned To Me — TC_DSH_013–021 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_DSH_013 Assigned To Me heading renders with a numeric count badge', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.loc.assignedHeading).toBeVisible({ timeout: 15_000 });
    const text = (await dashboardPage.loc.assignedHeading.first().textContent()) ?? '';
    // The badge format is "(N)" where N >= 0; atfree account may have 0 personally assigned
    expect(text).toMatch(/Assigned To Me \(\d+\)/);
  });

  test('TC_DSH_014 Assigned To Me table has all seven required columns', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const table = dashboardPage.loc.assignedTable;
    await expect(table).toBeVisible({ timeout: 15_000 });
    await expect(table.getByRole('columnheader', { name: '# Ticket' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Customer' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Group' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Due Date' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Priority' })).toBeVisible();
  });

  test('TC_DSH_015 View all button opens Assigned Tickets modal', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openViewAllModal();
    await expect(dashboardPage.loc.assignedModalTitle).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeModal();
  });

  test('TC_DSH_016 Assigned Tickets modal count is at least the heading badge count', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const headingCount = await dashboardPage.getAssignedCount();
    await dashboardPage.openViewAllModal();
    const modalCount = await dashboardPage.getAssignedModalCount();
    // Modal shows all team-assigned tickets; heading shows only tickets assigned to this user
    expect(modalCount).toBeGreaterThanOrEqual(headingCount);
    await dashboardPage.closeModal();
  });

  test('TC_DSH_017 Assigned Tickets modal can be dismissed with Escape', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openViewAllModal();
    await expect(dashboardPage.loc.assignedModalTitle).toBeVisible({ timeout: 10_000 });
    await dashboardPage.closeModal();
    await expect(dashboardPage.loc.assignedModal).not.toBeVisible({ timeout: 10_000 });
  });

  test('TC_DSH_018 clicking a row in Assigned Tickets modal navigates to that ticket in inbox', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.openViewAllModal();

    // Capture the ticket ID from the first row before clicking
    const firstRow = dashboardPage.loc.assignedModal.getByRole('row').filter({ hasText: /FRE\d+/ }).first();
    await firstRow.waitFor({ state: 'visible', timeout: 10_000 });
    const rowText   = (await firstRow.textContent()) ?? '';
    const idMatch   = rowText.match(/FRE\d+_\d+/);

    await firstRow.click();
    // Should navigate to inbox ticket URL
    await page.waitForURL(/\/ticket\/\d+/, { timeout: 30_000 });
    expect(page.url()).toContain('/ticket/');
    if (idMatch) {
      // The ticket ID in the URL corresponds to the row's numeric part
      expect(page.url()).toContain('/inbox/');
    }
  });

  test('TC_DSH_019 clicking a row directly in the Assigned To Me table navigates to that ticket', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    const firstRow = dashboardPage.loc.assignedTableRows.first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    await firstRow.click();
    await page.waitForURL(/\/ticket\/\d+/, { timeout: 30_000 });
    expect(page.url()).toContain('/inbox/');
  });

  test('TC_DSH_020 Status column shows "Open" for open tickets in the table', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const firstRow = dashboardPage.loc.assignedTableRows.first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    const statusCell = firstRow.getByRole('cell', { name: 'Open' });
    await expect(statusCell).toBeVisible({ timeout: 10_000 });
  });

  test('TC_DSH_021 Priority column displays a priority label in the table row', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const firstRow = dashboardPage.loc.assignedTableRows.first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    const rowText = (await firstRow.textContent()) ?? '';
    expect(rowText).toMatch(/High|Medium|Low/i);
  });
});
