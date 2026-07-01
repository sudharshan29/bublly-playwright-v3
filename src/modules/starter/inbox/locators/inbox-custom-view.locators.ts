import type { Page } from '@playwright/test';

export const inboxCustomViewLocators = (page: Page) => ({
  // ── Sidebar trigger ───────────────────────────────────────────────────
  customViewSidebarItem: page.getByText('Custom View', { exact: true }),

  // ── NOT behind upgrade wall on starter ───────────────────────────────
  upgradeLabel:          page.getByText('Upgrade', { exact: true }),

  // ── Add custom view button ────────────────────────────────────────────
  addViewBtn: page.getByRole('button', { name: /add.?view|create.?view/i }).or(
              page.getByRole('img', { name: /add/i })).first(),
});
