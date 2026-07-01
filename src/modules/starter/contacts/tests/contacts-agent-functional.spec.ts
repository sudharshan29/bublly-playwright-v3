import { test, expect } from '../../../../core/fixtures/agent-base.fixture';

test.describe('Starter Agent — Contacts Functional — TC_AGT_CON_001–004 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForURL(/contacts/, { timeout: 30_000 });
    // Wait for page content
    await page.getByRole('table').waitFor({ state: 'visible', timeout: 20_000 });
  });

  test('TC_AGT_CON_001 agent can view the contacts list (read access confirmed)', async ({ page }) => {
    // Agent should see the contacts table with at least one row
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 10_000 });
    const rows = page.getByRole('row');
    const count = await rows.count();
    // Header row + at least 1 data row
    expect(count).toBeGreaterThan(1);
  });

  test('TC_AGT_CON_002 agent can see the Add Contact button (QA workspace grants full access)', async ({ page }) => {
    // In the QA starter workspace the agent role has full contacts access
    const addContactBtn = page.getByRole('button', { name: /add contact/i });
    await expect(addContactBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC_AGT_CON_003 agent can see the Import button (QA workspace grants full access)', async ({ page }) => {
    // In the QA starter workspace the agent role has full contacts access
    const importBtn = page.getByRole('button', { name: 'Import', exact: true });
    await expect(importBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC_AGT_CON_004 agent does NOT see the Merge Contacts button', async ({ page }) => {
    const mergeBtn = page.getByRole('button', { name: /merge contacts/i });
    await expect(mergeBtn).not.toBeVisible({ timeout: 5_000 });
  });
});
