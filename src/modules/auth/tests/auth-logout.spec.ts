// Raw @playwright/test import is intentional for BOTH tests — using the base fixture here
// would cause addInitScript to re-inject sessionStorage on every navigation (including the
// post-logout /login redirect), silently re-authenticating the user and making logout
// verification impossible. Raw context has zero injection — logout behavior is testable.

import { test, expect } from '@playwright/test';
import { AuthPage }     from '../pages/auth.page';
import { env }          from '../../../../config/environment';

test.describe('Logout flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  test('TC_LGN_050 logout redirects to login page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.freeUser.email, env.freeUser.password);
    await page.waitForURL(/dashboard/, { timeout: 60_000 });

    await auth.logout();
    expect(page.url()).toMatch(/\/login$/);
  });

  test('TC_LGN_051 after logout accessing dashboard redirects to login @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.freeUser.email, env.freeUser.password);
    await page.waitForURL(/dashboard/, { timeout: 60_000 });

    await auth.logout();
    expect(page.url()).toMatch(/\/login$/);

    // No sessionStorage re-injection in this context — a genuine unauthenticated request
    await page.goto(env.baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 15_000 });
    expect(page.url()).toContain('login');
  });

});
