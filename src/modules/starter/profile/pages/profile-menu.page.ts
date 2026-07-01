import type { Page } from '@playwright/test';
import { TIMEOUTS }        from '../../../../core/constants/timeouts';
import { profileMenuLocators } from '../locators/profile-menu.locators';

export class ProfileMenuPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof profileMenuLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = profileMenuLocators(page);
  }

  async gotoDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForURL(/dashboard/, { timeout: TIMEOUTS.navigation });
    try {
      await this.loc.avatar.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.avatar.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }

  async openMenu(): Promise<void> {
    await this.loc.avatar.click();
    await this.loc.logoutItem.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.loc.logoutItem.click();
    await this.page.waitForURL(/login|auth/, { timeout: TIMEOUTS.navigation });
  }
}
