import type { Page } from '@playwright/test';

export const boardsStarterAddTicketLocators = (page: Page) => ({
  // ── Sidebar board links ───────────────────────────────────────────────
  bugBoardLink:     page.getByText('Bug', { exact: true }).first(),
  featureBoardLink: page.getByText('FeatureRequests', { exact: true }).first(),

  // ── Kanban board landmarks ────────────────────────────────────────────
  openColumnLabel:  page.locator('p').filter({ hasText: /^Open$/ }).first(),
  openColumnAddBtn: page.locator('.cursor-pointer.p-1 > svg').first(),

  // ── Add ticket modal ──────────────────────────────────────────────────
  addBugModalTitle:    page.getByText('Report a Bug', { exact: true }),
  addTicketTitleInput: page.getByPlaceholder('Enter a short, clear title'),
  addTicketSubmitBtn:  page.getByRole('button').filter({ hasText: /submit|create|report|send/i }).last(),
});
