import { test, expect } from '../../../../core/fixtures/starter-base.fixture';
import { env }          from '../../../../../config/environment';

test.describe('Starter Admin Sanity — TC_SAN_001–007 @sanity', () => {
  test.setTimeout(60_000);

  // ── Navigation sanity ────────────────────────────────────────────────────

  test('TC_SAN_001 starter admin can reach dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC_SAN_002 starter admin dashboard shows welcome heading with username', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible({ timeout: 20_000 });
    const text = (await heading.textContent()) ?? '';
    expect(text.toLowerCase()).toContain('welcome');
  });

  test('TC_SAN_003 starter admin inbox loads without error', async ({ page }) => {
    const inboxUrl = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`;
    await page.goto(inboxUrl);
    await page.waitForURL(/inbox/, { timeout: 30_000 });
    expect(page.url()).toContain('/inbox');
    expect(page.url()).not.toContain('/login');
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText).not.toMatch(/page not found/i);
  });

  test('TC_SAN_004 starter admin boards load without error', async ({ page }) => {
    const boardUrl = `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`;
    await page.goto(boardUrl);
    await page.waitForURL(/tickets/, { timeout: 30_000 });
    expect(page.url()).toContain('/tickets');
    expect(page.url()).not.toContain('/login');
  });

  test('TC_SAN_005 starter admin contacts page loads at /contacts', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForURL(/contacts/, { timeout: 30_000 });
    expect(page.url()).toContain('/contacts');
    expect(page.url()).not.toContain('/login');
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText).not.toMatch(/page not found/i);
  });

  test('TC_SAN_006 starter admin settings is accessible via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    const settingsIcon = page.locator('[id*="settings"], [data-nextstep*="settings"]').first();
    await settingsIcon.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsIcon.click();
    await page.waitForURL(/\/settings/, { timeout: 30_000 });
    expect(page.url()).toContain('/settings');
  });

  // ── Session sanity ───────────────────────────────────────────────────────

  test('TC_SAN_007 starter admin session persists after page reload', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    await page.reload();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30_000 });
    expect(page.url()).not.toContain('/login');
  });
});
  