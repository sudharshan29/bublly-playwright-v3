import type { Page } from '@playwright/test';
import { authLocators } from '../locators/auth.locators';
import { env }          from '../../../../config/environment';

export class AuthPage {
  private loc: ReturnType<typeof authLocators>;

  constructor(private page: Page) {
    this.loc = authLocators(page);
  }

  async gotoLogin(): Promise<void> {
    // Short first-try (30s) leaves budget for the catch retry within any 90s test timeout.
    // Catch uses the full 60s — if QA server is slow, the retry has more time to succeed.
    try {
      await this.page.goto(env.baseUrl + '/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      await this.page.goto(env.baseUrl + '/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await this.loc.emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    }
  }

  // Navigate directly to Step 2 using the ?email= query param shortcut
  async gotoStep2(email = env.freeUser.email): Promise<void> {
    const url = `${env.baseUrl}/login?email=${encodeURIComponent(email)}`;
    // Short first-try timeout (20s) so the catch fires in time for a retry within a 60s test timeout.
    // 60s first try = no room for retry when test.setTimeout is 60s.
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await this.loc.passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await this.loc.passwordInput.waitFor({ state: 'visible', timeout: 45_000 });
    }
    // Loading overlay (div.fixed.inset-0 z-100 backdrop) appears during page init on QA.
    // Clicks on step-2 elements (e.g. "Send me a code") will fail if overlay is still present.
    await this.loc.loadingOverlay.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  async gotoSignup(): Promise<void> {
    await this.page.goto(env.baseUrl + '/signup', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await this.page.getByLabel(/email/i).waitFor({ state: 'visible', timeout: 30_000 });
  }

  // Bublly two-step login: email → Sign In → still on /login → password → Sign In → /dashboard
  async login(email: string, password: string): Promise<void> {
    await this.loc.emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    await this.loc.loadingOverlay.waitFor({ state: 'hidden', timeout: 30_000 });
    await this.loc.emailInput.fill(email);
    await this.loc.signInBtn.click();

    await this.page.waitForURL(/login/, { timeout: 30_000, waitUntil: 'commit' });
    // 45s: QA server step-1→step-2 API can be slow under load
    await this.loc.passwordInput.waitFor({ state: 'visible', timeout: 45_000 });
    await this.loc.loadingOverlay.waitFor({ state: 'hidden', timeout: 30_000 });
    await this.loc.passwordInput.fill(password);
    await this.loc.signInBtn.click();
  }

  async logout(): Promise<void> {
    await this.loc.userMenu.click();
    // Logout option appears in the dropdown — wait for it before clicking
    await this.loc.logoutBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await this.loc.logoutBtn.click();
    await this.page.waitForURL(/\/login$/, { timeout: 15_000 });
  }

  async backToLogin(): Promise<void> {
    await this.loc.backToLoginBtn.click();
    await this.page.waitForURL(/\/login$/, { timeout: 10_000 });
  }

  async clickForgotPassword(): Promise<void> {
    await this.loc.forgotPasswordLink.click();
    await this.page.waitForURL(/forget-password/, { timeout: 10_000 });
  }

  async clickSendMeCode(): Promise<void> {
    await this.loc.sendMeCodeBtn.click();
    await this.page.waitForURL(/otpValidation/, { timeout: 15_000 });
  }

  async isSignInDisabled(): Promise<boolean> {
    return this.loc.signInBtn.isDisabled();
  }
}
