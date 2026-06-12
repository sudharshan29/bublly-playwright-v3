// Raw @playwright/test import is intentional — these tests run unauthenticated.
import { test, expect } from '@playwright/test';
import { AuthPage }     from '../pages/auth.page';
import { env }          from '../../../../config/environment';

// File-level serial: all tests in this file run on one worker.
// Both describe blocks trigger real email sends to the QA account — running them
// concurrently on separate workers causes QA server rate-limiting and page-load timeouts.
test.describe.configure({ mode: 'serial' });

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Forgot password page', () => {
  test.setTimeout(90_000);

  test('TC_LGN_040 forgot password page loads with email pre-filled from URL param @smoke', async ({ page }) => {
    const url = `${env.baseUrl}/forget-password?email=${encodeURIComponent(env.freeUser.email)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('textbox', { name: 'Email address' }).waitFor({ state: 'visible', timeout: 30_000 });
    const emailValue = await page.getByRole('textbox', { name: 'Email address' }).inputValue();
    expect(emailValue).toBe(env.freeUser.email);
  });

  test('TC_LGN_041 forgot password page shows heading and submit button @smoke', async ({ page }) => {
    const url = `${env.baseUrl}/forget-password?email=${encodeURIComponent(env.freeUser.email)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('heading', { name: /Forgot your password/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Forgot your password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Forgot your password/i })).toBeVisible();
  });

  test('TC_LGN_042 forgot password page Sign In link navigates back to login @smoke', async ({ page }) => {
    const url = `${env.baseUrl}/forget-password?email=${encodeURIComponent(env.freeUser.email)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('link', { name: 'Sign In' }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.waitForURL(/\/login$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login$/);
  });

  test('TC_LGN_043 forgot password form submission with valid email redirects to OTP page @smoke', async ({ page }) => {
    const url = `${env.baseUrl}/forget-password?email=${encodeURIComponent(env.freeUser.email)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('button', { name: /Forgot your password/i }).waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByRole('button', { name: /Forgot your password/i }).click();
    await page.waitForURL(/otpValidation/, { timeout: 20_000 });
    expect(page.url()).toContain('otpValidation');
    expect(page.url()).toContain('from=forgot_password');
  });

  test('TC_LGN_057 forgot password form with empty email shows inline validation error @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/forget-password', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByRole('button', { name: /Forgot your password/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByRole('button', { name: /Forgot your password/i }).click();
    // Button is enabled but clicking with empty field shows inline "Email is required." error
    await expect(page.getByText('Email is required.')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toContain('forget-password');
    expect(page.url()).not.toContain('otpValidation');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// OTP Validation page
// Serial mode: all 5 tests click "Send me a code" which triggers a real email send.
// Running them in parallel to the same QA account causes rate-limiting and slow page loads.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('OTP validation page', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  test('TC_LGN_044 OTP page shows 6 individual digit input fields @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    // domcontentloaded avoids waiting for slow QA server load event
    await page.waitForURL(/otpValidation/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: /Enter Verification code/i }).waitFor({ state: 'visible', timeout: 30_000 });
    for (let i = 1; i <= 6; i++) {
      await expect(page.getByRole('textbox', { name: `Digit ${i} of 6` })).toBeVisible({ timeout: 10_000 });
    }
  });

  test('TC_LGN_045 OTP page shows masked email address in verification message @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await page.waitForURL(/otpValidation/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: /Enter Verification code/i }).waitFor({ state: 'visible', timeout: 30_000 });
    // Email is partially masked: atf******@mailinator.com
    await expect(page.getByText(/We have sent you a passcode/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/mailinator\.com/i)).toBeVisible();
  });

  test('TC_LGN_046 OTP page shows Resend OTP countdown timer @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await page.waitForURL(/otpValidation/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: /Enter Verification code/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await expect(page.getByText(/Resend OTP in/i)).toBeVisible({ timeout: 15_000 });
  });

  test('TC_LGN_047 OTP page Wrong email Go back link navigates to Step 2 with email param @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await page.waitForURL(/otpValidation/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: /Enter Verification code/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByRole('link', { name: 'Go back' }).waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByRole('link', { name: 'Go back' }).click();
    await page.waitForURL(/login\?email=/, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    expect(page.url()).toContain('email=');
  });

  test('TC_LGN_048 OTP page shows verification email sent success toast @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await page.waitForURL(/otpValidation/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: /Enter Verification code/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await expect(page.getByText(/Verification email sent successfully/i)).toBeVisible({ timeout: 10_000 });
  });

});
