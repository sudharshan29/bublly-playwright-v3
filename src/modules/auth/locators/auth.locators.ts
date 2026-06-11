import type { Page } from '@playwright/test';

export function authLocators(page: Page) {
  return {
    // Step 1 — email (shown on first load of /login)
    emailInput:     page.getByRole('textbox', { name: 'Work Email*' }),
    // Step 2 — password (shown after clicking Sign In with email, still on /login)
    passwordInput:  page.getByRole('textbox', { name: 'Password*' }),
    // Single Sign In button used in both steps
    signInBtn:      page.getByRole('button', { name: 'Sign In', exact: true }),
    // Loading overlay — appears between login transitions; wait for hidden before interacting
    loadingOverlay: page.locator('div.fixed.inset-0'),
    // Error states
    errorMessage:   page.getByRole('alert'),
    emailError:     page.getByText(/email.*required|valid email/i),

    // Signup form
    nameInput:      page.getByLabel(/name/i),
    signUpBtn:      page.getByRole('button', { name: /sign up|create account/i }),
    signupLink:     page.getByRole('link',   { name: /sign up|create account/i }),
    loginLink:      page.getByRole('link',   { name: /log in|sign in/i }),
    duplicateError: page.getByText(/already.*exists|account.*exists|email.*taken/i),

    // Post-login
    logoutBtn:      page.getByRole('button', { name: /log out|sign out/i }),
    userMenu:       page.getByRole('button', { name: /account|profile|avatar/i }),
  };
}
