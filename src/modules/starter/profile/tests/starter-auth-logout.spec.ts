// Raw @playwright/test is intentional — the base fixture injects sessionStorage on every
// navigation, making post-logout redirect verification impossible. Raw context = no injection.

import { test, expect } from '@playwright/test';
import { AuthPage }     from '../../../auth/pages/auth.page';
import { env }          from '../../../../../config/environment';

// Helper: click the user avatar — title can be email-prefix or display name
async function clickAvatar(page: import('@playwright/test').Page): Promise<void> {
  const prefix      = env.starterUser.email.split('@')[0]; // 'atstarter'
  const displayName = 'starter admin';
  const avatar = page.getByTitle(prefix).or(page.getByTitle(displayName)).first();
  await avatar.waitFor({ state: 'visible', timeout: 15_000 });
  await avatar.click();
}

test.describe('Starter Admin — Logout flow — TC_PRO_LGT_001–002', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  test('TC_PRO_LGT_001 starter admin logout redirects to login page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.starterUser.email, env.starterUser.password);
    await page.waitForURL(/dashboard/, { timeout: 60_000 });

    await clickAvatar(page);
    await page.getByText('Logout', { exact: true }).waitFor({ state: 'visible', timeout: 5_000 });
    await page.getByText('Logout', { exact: true }).click();
    await page.waitForURL(/\/login$/, { timeout: 15_000 });

    expect(page.url()).toMatch(/\/login$/);
  });

  test('TC_PRO_LGT_002 after logout dashboard access redirects to login @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.starterUser.email, env.starterUser.password);
    await page.waitForURL(/dashboard/, { timeout: 60_000 });

    await clickAvatar(page);
    await page.getByText('Logout', { exact: true }).waitFor({ state: 'visible', timeout: 5_000 });
    await page.getByText('Logout', { exact: true }).click();
    await page.waitForURL(/\/login$/, { timeout: 15_000 });

    await page.goto(env.baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 15_000 });
    expect(page.url()).toContain('login');
  });
});
