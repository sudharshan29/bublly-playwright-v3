import { test, expect } from '../../../../core/fixtures/agent-base.fixture';
import { env }          from '../../../../../config/environment';
import { TIMEOUTS }     from '../../../../core/constants/timeouts';

const INBOX_URL  = `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`;
const BOARDS_URL = `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`;

test.describe('RBAC extended agent restrictions — TC_RAGENT_001–010 @rbac', () => {
  test.setTimeout(90_000);

  // ── Inbox sidebar restrictions ────────────────────────────────────────────

  test('TC_RAGENT_001 agent sees NO "+ Add new" button next to Groups', async ({ page }) => {
    await page.goto(INBOX_URL);
    await page.waitForURL(/inbox/, { timeout: TIMEOUTS.navigation });
    await page.waitForTimeout(2_000);
    const addBtn = page.getByRole('img', { name: /add/i })
      .or(page.locator('button').filter({ hasText: /add new/i })).first();
    await expect(addBtn).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_RAGENT_002 agent sees NO "+ Add new" button next to Custom View', async ({ page }) => {
    await page.goto(INBOX_URL);
    await page.waitForURL(/inbox/, { timeout: TIMEOUTS.navigation });
    await page.waitForTimeout(2_000);
    const customView = page.getByText('Custom View', { exact: true });
    await expect(customView).toBeVisible({ timeout: 10_000 });
    const addBtn = page.locator('button').filter({ hasText: /create view|add new/i }).first();
    await expect(addBtn).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_RAGENT_003 agent does NOT see Inbox Settings link in sidebar', async ({ page }) => {
    await page.goto(INBOX_URL);
    await page.waitForURL(/inbox/, { timeout: TIMEOUTS.navigation });
    await page.waitForTimeout(2_000);
    const settingsLink = page.getByText('Inbox Settings', { exact: true });
    await expect(settingsLink).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Boards restrictions ───────────────────────────────────────────────────

  test('TC_RAGENT_006 agent boards toolbar does NOT show settings gear icon', async ({ page }) => {
    await page.goto(BOARDS_URL);
    await page.waitForURL(/tickets/, { timeout: TIMEOUTS.navigation });
    await page.locator('p').filter({ hasText: /^Open$/ }).first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    const settingsGear = page.locator('.lucide-settings, [data-id="settings"], svg[class*="settings"]').first();
    await expect(settingsGear).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_RAGENT_007 agent does NOT see Custom Boards in boards sidebar', async ({ page }) => {
    await page.goto(BOARDS_URL);
    await page.waitForURL(/tickets/, { timeout: TIMEOUTS.navigation });
    await page.locator('p').filter({ hasText: /^Open$/ }).first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    const customBoards = page.getByText('Custom Boards', { exact: true });
    await expect(customBoards).not.toBeVisible({ timeout: 5_000 });
  });

  test('TC_RAGENT_008 agent can view Bug board kanban', async ({ page }) => {
    await page.goto(BOARDS_URL);
    await page.waitForURL(/tickets/, { timeout: TIMEOUTS.navigation });
    const bugBoard = page.getByText('Bug', { exact: true }).first();
    await expect(bugBoard).toBeVisible({ timeout: 15_000 });
    const openCol = page.locator('p').filter({ hasText: /^Open$/ }).first();
    await expect(openCol).toBeVisible({ timeout: 15_000 });
  });

  test('TC_RAGENT_009 agent can view FeatureRequests board', async ({ page }) => {
    await page.goto(BOARDS_URL);
    await page.waitForURL(/tickets/, { timeout: TIMEOUTS.navigation });
    const featureLink = page.getByText('FeatureRequests', { exact: true }).first();
    await expect(featureLink).toBeVisible({ timeout: 15_000 });
    await featureLink.click();
    await expect(page.locator('p').filter({ hasText: /^Open$/ }).first())
      .toBeVisible({ timeout: 15_000 });
  });

  test('TC_RAGENT_010 agent can add tickets via + on board Open column', async ({ page }) => {
    await page.goto(BOARDS_URL);
    await page.waitForURL(/tickets/, { timeout: TIMEOUTS.navigation });
    await page.locator('p').filter({ hasText: /^Open$/ }).first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    const addBtn = page.locator('.cursor-pointer.p-1 > svg').first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
  });
});
