import type { Page } from '@playwright/test';

export const inboxGroupsLocators = (page: Page) => ({
  // ── Sidebar trigger ───────────────────────────────────────────────────
  groupsSidebarItem: page.getByText('Groups', { exact: true }),

  // ── Groups are NOT behind an upgrade wall on starter ──────────────────
  // Absence of "Upgrade" text next to Groups validates the plan gate
  upgradeLabel:      page.getByText('Upgrade', { exact: true }),

  // ── Groups section content ────────────────────────────────────────────
  addGroupBtn: page.getByRole('button', { name: /add.?group|create.?group/i }).or(
               page.getByRole('img', { name: /add/i })).first(),
});
