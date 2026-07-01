import type { Page } from '@playwright/test';

export const boardsUpgradeLocators = (page: Page) => ({
  // ── Sidebar trigger ───────────────────────────────────────────────────
  customBoardsLink: page.getByText('Custom Boards', { exact: true }).first(),
  lockIcon:         page.locator('.lucide-lock, [class*="lucide-lock"]').first(),

  // ── Upgrade / Plans modal ─────────────────────────────────────────────
  modal:            page.getByRole('dialog'),
  modalHeading:     page.getByRole('dialog').getByRole('heading').first(),
  closeBtn:         page.getByRole('dialog').getByRole('button', { name: /close/i }).first(),
});
