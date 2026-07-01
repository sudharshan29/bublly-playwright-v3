import type { Page } from '@playwright/test';

export const contactsStarterLocators = (page: Page) => ({
  // ── Page header ───────────────────────────────────────────────────────
  pageHeading:    page.locator('p').filter({ hasText: /^Contacts$/ }).first(),

  // ── Sidebar segments ──────────────────────────────────────────────────
  sidebarAll:     page.locator('div').filter({ hasText: /^All/ }).and(page.locator('[cursor=pointer], [class*="cursor-pointer"]')).first(),
  sidebarUsers:   page.locator('div').filter({ hasText: /^Users/ }).and(page.locator('[cursor=pointer], [class*="cursor-pointer"]')).first(),
  sidebarGuests:  page.locator('div').filter({ hasText: /^Guests/ }).first(),

  // ── Toolbar ───────────────────────────────────────────────────────────
  // Search input — placeholder text varies between plans; fall back to any input in the toolbar
  searchInput:    page.getByRole('textbox').or(page.locator('input[type="text"], input[type="search"]')).first(),
  importBtn:      page.getByRole('button', { name: 'Import' }),
  addContactBtn:  page.getByRole('button', { name: /Add Contact/ }),

  // ── Table ─────────────────────────────────────────────────────────────
  contactTable:   page.getByRole('table'),
  nameColHeader:  page.getByRole('columnheader', { name: 'Name' }),
  emailColHeader: page.getByRole('columnheader', { name: 'Email' }),
});
