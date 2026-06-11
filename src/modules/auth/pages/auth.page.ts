import type { Page } from '@playwright/test';
import { authLocators } from '../locators/auth.locators';
import { env }          from '../../../../config/environment';

export class AuthPage {
  private loc: ReturnType<typeof authLocators>;

  constructor(private page: Page) {
    this.loc = authLocators(page);
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto(env.baseUrl + '/login');
  }

  async gotoSignup(): Promise<void> {
    await this.page.goto(env.baseUrl + '/signup');
  }

  // Bublly two-step login: email → Sign In → still on /login → password → Sign In → /dashboard
  async login(email: string, password: string): Promise<void> {
    await this.loc.emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    await this.loc.loadingOverlay.waitFor({ state: 'hidden', timeout: 30_000 });
    await this.loc.emailInput.fill(email);
    await this.loc.signInBtn.click();

    await this.page.waitForURL(/login/, { timeout: 30_000, waitUntil: 'commit' });
    await this.loc.passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
    await this.loc.loadingOverlay.waitFor({ state: 'hidden', timeout: 30_000 });
    await this.loc.passwordInput.fill(password);
    await this.loc.signInBtn.click();
  }

  async logout(): Promise<void> {
    try {
      await this.loc.userMenu.click({ timeout: 3_000 });
    } catch {
      // Some apps expose logout button directly
    }
    await this.loc.logoutBtn.click();
    await this.page.waitForURL(/login/, { timeout: 15_000 });
  }

  async getErrorText(): Promise<string> {
    return (await this.loc.errorMessage.textContent()) ?? '';
  }
}
