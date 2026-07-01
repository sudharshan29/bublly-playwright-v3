import type { Page } from '@playwright/test';
import { env } from '../../../../../config/environment';

export const profileMenuLocators = (page: Page) => ({
  // Avatar: try email prefix title first, then display-name "starter admin" as fallback
  // Free plan: getByTitle('atfree') — title = email prefix
  // Starter admin display name is "starter admin" — title may differ from email prefix
  avatar: page
    .getByTitle(env.starterUser.email.split('@')[0])
    .or(page.getByTitle('starter admin'))
    .first(),

  // Logout is a styled div, NOT a button — matches free-plan pattern
  logoutItem: page.getByText('Logout', { exact: true }),
});
