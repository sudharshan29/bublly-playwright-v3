import { test, expect } from '@playwright/test';
import { AuthPage }     from '../pages/auth.page';
import { env }          from '../../../../config/environment';

// MANDATORY — never remove
test.describe.configure({ mode: 'serial' });

test.describe('Signup form', () => {

  test('TC_AUTH_009 signup page loads with required fields visible @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignup();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });

  test('TC_AUTH_010 signup with existing email shows duplicate account error @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignup();

    await page.getByLabel(/email/i).fill(env.freeUser.email);

    try {
      await page.getByLabel(/name/i).fill('Test User', { timeout: 2_000 });
    } catch {
      // Name field not required on this form — skip
    }
    try {
      await page.getByLabel(/password/i).fill('TestPassword123!', { timeout: 2_000 });
    } catch {
      // Password may be on next step — skip
    }

    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

    await expect(
      page.getByText(/already.*exists|account.*exists|email.*taken|already registered/i)
    ).toBeVisible({ timeout: 10_000 });
  });

});
