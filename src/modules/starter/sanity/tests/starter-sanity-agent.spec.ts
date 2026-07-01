import { test, expect } from '../../../../core/fixtures/agent-base.fixture';
import { env }          from '../../../../../config/environment';

test.describe('Starter Agent Sanity — TC_SAN_008–014 @sanity', () => {
  test.setTimeout(60_000);

  // ── Navigation sanity ────────────────────────────────────────────────────

  test('TC_SAN_008 starter agent can reach inbox', async ({ page }) => {
    const inboxUrl = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`;
    await page.goto(inboxUrl);
    await page.waitForURL(/inbox/, { timeout: 30_000 });
    expect(page.url()).toContain('/inbox');
    expect(page.url()).not.toContain('/login');
  });

  test('TC_SAN_009 starter agent can reach boards', async ({ page }) => {
    const boardUrl = `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`;
    await page.goto(boardUrl);
    await page.waitForURL(/tickets/, { timeout: 30_000 });
    expect(page.url()).toContain('/tickets');
    expect(page.url()).not.toContain('/login');
  });

  test('TC_SAN_010 starter agent can reach contacts page', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForURL(/contacts/, { timeout: 30_000 });
    expect(page.url()).toContain('/contacts');
    expect(page.url()).not.toContain('/login');
  });

  // ── Access restriction sanity ────────────────────────────────────────────

  test('TC_SAN_011 starter agent settings gear icon is not visible in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30_000 });
    await page.waitForTimeout(2_000);
    const settingsIcon = page.locator('[id="tour-step-settings"], [data-nextstep="settings"]').first();
    await expect(settingsIcon).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_SAN_012 starter agent navigating to /settings is blocked', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2_000);
    const url      = page.url();
    const bodyText = await page.locator('body').textContent() ?? '';
    const isBlocked =
      bodyText.includes('Page not found') ||
      bodyText.includes('not exist')      ||
      url.includes('/dashboard')          ||
      url.includes('/inbox');
    expect(isBlocked).toBe(true);
  });

  test('TC_SAN_013 starter agent Groups Add New button is not visible', async ({ page }) => {
    const inboxUrl = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`;
    await page.goto(inboxUrl);
    await page.waitForURL(/inbox/, { timeout: 30_000 });
    await page.waitForTimeout(2_000);
    // Agent cannot add new groups — the "+ Add" button must be absent
    const addGroupBtn = page.getByRole('button', { name: /^\+\s*(add|new)/i }).first();
    await expect(addGroupBtn).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Session sanity ───────────────────────────────────────────────────────

  test('TC_SAN_014 starter agent session persists after page reload', async ({ page }) => {
    const inboxUrl = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`;
    await page.goto(inboxUrl);
    await page.waitForURL(/inbox/, { timeout: 30_000 });
    await page.reload();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30_000 });
    expect(page.url()).not.toContain('/login');
  });
});
