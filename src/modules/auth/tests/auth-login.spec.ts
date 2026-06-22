// Raw @playwright/test import is intentional — auth tests run unauthenticated.
// Using the base fixture would inject sessionStorage auth tokens and bypass login flows.
import { test, expect } from '@playwright/test';
import { AuthPage }     from '../pages/auth.page';
import { env }          from '../../../../config/environment';

// ─────────────────────────────────────────────────────────────────────────────
// Existing smoke — Step 1 basic render + auth guards
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login page — unauthenticated', () => {
  test.setTimeout(60_000);

  test('TC_AUTH_002 login page renders email field and Sign In button @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(page.getByRole('textbox', { name: 'Work Email*' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('TC_AUTH_003 login with wrong password is rejected and stays on login page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    // Password must pass client-side validation (uppercase required) but be wrong for the account
    await auth.login(env.freeUser.email, 'WrongPassword_Auth003!');
    // API returns 404 for wrong credentials; frontend stays on login — verify no redirect to dashboard
    await page.waitForResponse(r => r.url().includes('/auth/login'), { timeout: 15_000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).not.toContain('/dashboard');
  });

  test('TC_AUTH_004 login form blocks submit with empty email @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill('');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeDisabled();
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

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Email field validation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login Step 1 — email validation', () => {
  test.setTimeout(60_000);

  test('TC_LGN_011 invalid email format shows inline validation error @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill('notanemail');
    // Error is a <p class="text-primary-red-700 text-xs"> — appears after blur event.
    // Clicking the heading triggers a real browser blur (more reliable than evaluate/Tab).
    await page.getByRole('heading', { name: 'Welcome back' }).click();
    await expect(page.locator('p.text-primary-red-700')).toBeVisible({ timeout: 5_000 });
  });

  test('TC_LGN_012 sign in button stays disabled for invalid email format @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill('notanemail');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeDisabled();
  });

  test('TC_LGN_013 unregistered email shows email does not exist error @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill('nonexistent_qa_xyz_12345@test.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Email does not exist. Please sign up first.')).toBeVisible({ timeout: 20_000 });
  });

  test('TC_LGN_014 valid registered email advances to step 2 and URL contains email param @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    // 45s: QA server can be slow to process the step-1 submit after a DNS recovery
    await page.waitForURL(/login\?email=/, { timeout: 45_000, waitUntil: 'commit' });
    expect(page.url()).toContain('email=');
  });

  test('TC_LGN_015 signup link on login page navigates to signup page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('link', { name: 'Signup' }).click();
    await page.waitForURL(/signup/, { timeout: 15_000 });
    expect(page.url()).toContain('/signup');
  });

  test('TC_LGN_016 sign in with google button is visible on login page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).waitFor({ state: 'visible', timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('TC_LGN_017 language selector English button is visible on login page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  });

  test('TC_LGN_018 login page title is Bublly Desk @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(page).toHaveTitle('Bublly Desk');
  });

  test('TC_LGN_019 Enter key in email field submits Step 1 and advances to Step 2 @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
    await page.keyboard.press('Enter');
    await page.waitForURL(/login\?email=/, { timeout: 30_000, waitUntil: 'commit' });
    expect(page.url()).toContain('email=');
  });

  test('TC_LGN_031 language selector click opens dropdown with language options @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('button', { name: 'English' }).click();
    // Dropdown renders each language as a button — verify two representative options appear
    await expect(page.getByRole('button', { name: 'Deutsch German' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Español Spanish' })).toBeVisible();
  });

  test('TC_LGN_032 email input trims leading and trailing spaces and enables Sign In @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill('  ' + env.freeUser.email + '  ');
    // React controlled input strips surrounding whitespace — Sign In becomes enabled with the clean email
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled({ timeout: 3_000 });
    const inputValue = await page.getByRole('textbox', { name: 'Work Email*' }).inputValue();
    expect(inputValue).toBe(env.freeUser.email);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path — full end-to-end login
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login — happy path', () => {
  test.setTimeout(90_000);

  test('TC_LGN_020 correct credentials login redirects to dashboard @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.freeUser.email, env.freeUser.password);
    await page.waitForURL(/dashboard/, { timeout: 60_000, waitUntil: 'commit' });
    expect(page.url()).toContain('dashboard');
    expect(page.url()).not.toContain('login');
  });

  test('TC_LGN_022 Enter key in password field submits login and redirects to dashboard @smoke', async ({ page }) => {
    test.setTimeout(120_000);
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('textbox', { name: 'Password*' }).fill(env.freeUser.password);
    await page.keyboard.press('Enter');
    await page.waitForURL(/dashboard/, { timeout: 60_000, waitUntil: 'commit' });
    expect(page.url()).toContain('dashboard');
    expect(page.url()).not.toContain('login');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Password entry & navigation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login Step 2 — password and navigation', () => {
  test.setTimeout(60_000);

  test('TC_LGN_023 email field is disabled in step 2 @smoke', async ({ page }) => {
    test.setTimeout(120_000);
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await expect(page.getByRole('textbox', { name: 'Work Email*' })).toBeDisabled();
  });

  test('TC_LGN_024 password field is masked by default @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    const inputType = await page.locator('input[placeholder="Enter your password"]').getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('TC_LGN_026 eye icon toggles password field to visible text @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.locator('input[placeholder="Enter your password"]').fill('Test@123');
    await page.locator('input[placeholder="Enter your password"]').locator('..').getByRole('button').click();
    const inputType = await page.locator('input[placeholder="Enter your password"]').getAttribute('type');
    expect(inputType).toBe('text');
  });

  test('TC_LGN_033 back to login button returns to step 1 and clears email from URL @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Back to Login' }).click();
    await page.waitForURL(/\/login$/, { timeout: 10_000 });
    expect(page.url()).not.toContain('email=');
  });

  test('TC_LGN_034 forgot password link navigates to forget-password page with email param @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('link', { name: /Forgot your password/i }).click();
    await page.waitForURL(/forget-password/, { timeout: 10_000 });
    expect(page.url()).toContain('forget-password');
    expect(page.url()).toContain('email=');
  });

  test('TC_LGN_035 send me a code navigates to OTP validation page @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await page.waitForURL(/otpValidation/, { timeout: 15_000 });
    expect(page.url()).toContain('otpValidation');
    expect(page.url()).toContain('from=login');
  });

  test('TC_LGN_038 direct URL with email param renders step 2 immediately @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await expect(page.getByRole('textbox', { name: 'Password*' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send me a code' })).toBeVisible();
  });

  test('TC_LGN_027 wrong password is rejected and does not navigate to dashboard @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.login(env.freeUser.email, 'WrongPassword_QA_999!');
    // API returns 404 for wrong credentials; frontend stays on login page silently
    await page.waitForResponse(r => r.url().includes('/auth/login'), { timeout: 15_000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).not.toContain('/dashboard');
  });

  test('TC_LGN_021 pre-filled email in step 2 matches email entered in step 1 @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/login\?email=/, { timeout: 30_000, waitUntil: 'commit' });
    const emailValue = await page.getByRole('textbox', { name: 'Work Email*' }).inputValue();
    expect(emailValue).toBe(env.freeUser.email);
  });

  test('TC_LGN_025 remember me checkbox is visible and unchecked by default @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    const checkbox = page.getByRole('checkbox', { name: 'Remember me' });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('TC_LGN_028 remember me checkbox can be checked @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    // The <input type="checkbox"> is visually hidden inside a React wrapper div.
    // Clicking the parent container (..) is the reliable way to toggle the state.
    await page.getByRole('checkbox', { name: 'Remember me' }).locator('..').click();
    await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
  });

  test('TC_LGN_029 sign in with empty password shows Password is required inline error @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    // Sign In is enabled with empty password (unlike Step 1 where empty email disables it)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Password is required.')).toBeVisible({ timeout: 5_000 });
  });

  test('TC_LGN_030 eye icon second click toggles password back to masked @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    await page.locator('input[placeholder="Enter your password"]').fill('Test@123');
    const toggle = page.locator('input[placeholder="Enter your password"]').locator('..').getByRole('button');
    await toggle.click();
    await toggle.click();
    const inputType = await page.locator('input[placeholder="Enter your password"]').getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('TC_LGN_036 sign in button is enabled in step 2 even when password is empty @smoke', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoStep2();
    // Step 1 disables Sign In with empty email — Step 2 does NOT disable Sign In with empty password.
    // Submitting with empty password triggers inline "Password is required." error instead.
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled();
  });

  test('TC_LGN_037 browser back button from Step 2 returns to Step 1 @smoke', async ({ page }) => {
    test.setTimeout(90_000);
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    // waitUntil:'commit' — URL changes immediately but QA server load event can take >30s
    await page.waitForURL(/login\?email=/, { timeout: 30_000, waitUntil: 'commit' });
    // Native browser Back — distinct from the "Back to Login" button (TC_LGN_033)
    await page.goBack();
    await page.waitForURL(/\/login$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login$/);
    await expect(page.getByRole('textbox', { name: 'Work Email*' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('textbox', { name: 'Password*' })).not.toBeVisible();
  });

});
