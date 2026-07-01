import type { Page } from '@playwright/test';
import { env }                          from '../../../../../config/environment';
import { TIMEOUTS }                     from '../../../../core/constants/timeouts';
import { inboxSettingsModalLocators }   from '../locators/inbox-settings-modal.locators';

export class InboxSettingsModalPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof inboxSettingsModalLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = inboxSettingsModalLocators(page);
  }

  async gotoInbox(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`
    );
    try {
      await this.loc.settingsLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.settingsLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }

  async openModal(): Promise<void> {
    await this.loc.settingsLink.click();
    await this.loc.panel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async closeModal(): Promise<void> {
    await this.loc.closeBtn.click();
    await this.loc.panel
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  isPanelVisible(): Promise<boolean> {
    return this.loc.panel.isVisible();
  }
}
