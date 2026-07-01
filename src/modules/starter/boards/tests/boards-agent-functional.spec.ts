import { test, expect } from '../../../../core/fixtures/agent-base.fixture';
import { env } from '../../../../../config/environment';

const BOARD_URL = `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`;

// Helper: navigate to starter board and open the first ticket card
async function openFirstBoardTicket(page: import('@playwright/test').Page) {
  await page.goto(BOARD_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  const openCol = page.locator('p').filter({ hasText: /^Open$/ }).first();
  await openCol.waitFor({ state: 'visible', timeout: 30_000 });
  // Kanban ticket cards have aria-roledescription="sortable" — unique to draggable cards
  const card = page.locator('[aria-roledescription="sortable"]').first();
  await card.waitFor({ state: 'visible', timeout: 15_000 });
  await card.click();
  const detailPanel = page.locator('[class*="headerPadding"][class*="w-full"]').first();
  await detailPanel.waitFor({ state: 'visible', timeout: 20_000 });
  return detailPanel;
}

test.describe('Starter Agent — Boards Functional — TC_AGT_BRD_001–002 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_AGT_BRD_001 agent can click a board ticket and detail panel opens', async ({ page }) => {
    const detailPanel = await openFirstBoardTicket(page);
    await expect(detailPanel).toBeVisible({ timeout: 15_000 });
    // Composer must load confirming thread is visible
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first()
      .or(page.locator('[contenteditable="true"]').first());
    await expect(composer).toBeVisible({ timeout: 20_000 });
  });

  test('TC_AGT_BRD_002 agent can type a reply in board ticket composer', async ({ page }) => {
    await openFirstBoardTicket(page);
    const composer = page.locator('[role="textbox"][aria-multiline="true"]').first()
      .or(page.locator('[contenteditable="true"]').first());
    await composer.waitFor({ state: 'visible', timeout: 20_000 });
    await composer.fill('TC_AGT_BRD_002 agent board reply — automation test');
    const typed = await composer.innerText();
    expect(typed).toContain('TC_AGT_BRD_002');
    // Clear without sending
    await composer.clear();
  });
});
