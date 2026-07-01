import type { Page } from '@playwright/test';

export const inboxSettingsModalLocators = (page: Page) => ({
  // ── Trigger ───────────────────────────────────────────────────────────
  settingsLink: page.getByText('Inbox Settings', { exact: true }).first(),

  // ── Settings panel (not a dialog — uses a heading-based sheet) ────────
  panel:        page.getByRole('heading', { name: 'Inbox Settings' }),
  closeBtn:     page.getByRole('button', { name: 'Close dialog' }),
});
