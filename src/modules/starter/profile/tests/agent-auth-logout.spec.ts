// Raw @playwright/test is intentional — the base fixture injects sessionStorage on every
// navigation, making post-logout redirect verification impossible. Raw context = no injection.

import { test, expect } from '@playwright/test';
import { AuthPage }     from '../../../auth/pages/auth.page';
import { env }          from '../../../../../config/environment';

async function clickAvatar(page: import('@playwright/test').Page): Promise<void> {
  // The avatar is a cursor-pointer element in the top-right nav that contains the user's initial (single uppercase letter).
  // Its accessible name is the display name (e.g. "userone"), NOT the email prefix.
  const avatar = page.locator('[class*="cursor-pointer"]')
    .filter({ hasText: /^[A-Z]$/ })
    .last();
  await avatar.waitFor({ state: 'visible', timeout: 15_000 });
  await avatar.click();
}

test.describe('Starter Agent — Logout flow — TC_AGT_PRO_001 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_AGT_PRO_001 agent logout redirects to login page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.starterAgent.email, env.starterAgent.password);
    // Agent lands on inbox after login
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60_000 });

    await clickAvatar(page);
    const logoutItem = page.getByText('Logout', { exact: true });
    await logoutItem.waitFor({ state: 'visible', timeout: 10_000 });
    await logoutItem.click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    expect(page.url()).toContain('login');
  });
});
