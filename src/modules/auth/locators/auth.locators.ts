import type { Page } from '@playwright/test';
import { env }         from '../../../../config/environment';

export function authLocators(page: Page) {
  return {
    // ── Step 1 — email ────────────────────────────────────────────────────────
    emailInput:          page.getByRole('textbox', { name: 'Work Email*' }),
    signInBtn:           page.getByRole('button', { name: 'Sign In', exact: true }),
    // Inline errors shown below the email field (client-side + server-side)
    emailFormatError:    page.getByText('Please enter a valid email address.'),
    emailNotExistError:  page.getByText('Email does not exist. Please sign up first.'),
    signupLink:          page.getByRole('link', { name: 'Signup' }),
    signInWithGoogle:    page.getByRole('button', { name: 'Sign in with Google' }),

    // ── Step 2 — password ─────────────────────────────────────────────────────
    passwordInput:       page.getByRole('textbox', { name: 'Password*' }),
    // Eye icon button inside the password field wrapper — toggles type password↔text
    passwordToggleBtn:   page.locator('input[placeholder="Enter your password"]').locator('..').getByRole('button'),
    rememberMeCheckbox:  page.getByRole('checkbox', { name: 'Remember me' }),
    forgotPasswordLink:  page.getByRole('link', { name: /Forgot your password/i }),
    backToLoginBtn:      page.getByRole('button', { name: 'Back to Login' }),
    sendMeCodeBtn:       page.getByRole('button', { name: 'Send me a code' }),

    // ── Shared ────────────────────────────────────────────────────────────────
    loadingOverlay:      page.locator('div.fixed.inset-0'),
    // NOTE: page.getByRole('alert') is NOT safe for toast detection in Bublly.
    // Next.js always injects <div role="alert" id="__next-route-announcer__"> which is
    // permanently visible and empty — getByRole('alert') matches it, not the toast.
    // Always target toast text directly: page.getByText(/Login failed.../i)
    loginFailedToast:    page.getByText(/Login failed\. Please check your credentials/i),

    // ── Signup form ───────────────────────────────────────────────────────────
    nameInput:           page.getByLabel(/name/i),
    signUpBtn:           page.getByRole('button', { name: /sign up|create account/i }),
    loginLink:           page.getByRole('link', { name: /log in|sign in/i }),
    duplicateError:      page.getByText(/already.*exists|account.*exists|email.*taken/i),

    // ── Post-login ────────────────────────────────────────────────────────────
    // Avatar in the bottom-left sidebar — title attribute matches the email prefix (e.g. "atfree")
    userMenu:            page.getByTitle(env.freeUser.email.split('@')[0]),
    // Logout is a styled div, NOT a <button> — confirmed from live DOM inspection
    logoutBtn:           page.getByText('Logout', { exact: true }),
  };
}
