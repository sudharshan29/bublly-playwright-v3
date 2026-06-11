import { test, expect } from '@playwright/test';
import { AuthPage }     from '../pages/auth.page';
import { env }          from '../../../../config/environment';

test.describe('Login page — unauthenticated', () => {

  test('TC_AUTH_002 login page renders email field and Sign In button @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(page.getByRole('textbox', { name: 'Work Email*' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('TC_AUTH_003 login with wrong password shows error message @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.freeUser.email, 'wrong_password_xyz_12345');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('TC_AUTH_004 login form blocks submit with empty email @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    const emailInput = page.getByRole('textbox', { name: 'Work Email*' });
    await emailInput.fill('');
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    // Button should be disabled when email is empty
    await expect(signInBtn).toBeDisabled();
  });

  test('TC_AUTH_005 unauthenticated access to /inbox redirects to login @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/inbox');
    await page.waitForURL(/login/, { timeout: 15_000 });
    expect(page.url()).toContain('login');
  });

  test('TC_AUTH_006 unauthenticated access to /dashboard redirects to login @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/dashboard');
    await page.waitForURL(/login/, { timeout: 15_000 });
    expect(page.url()).toContain('login');
  });

});
