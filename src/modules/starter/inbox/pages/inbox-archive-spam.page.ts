import type { Page } from '@playwright/test';
import { env }                        from '../../../../../config/environment';
import { TIMEOUTS }                   from '../../../../core/constants/timeouts';
import { inboxArchiveSpamLocators }   from '../locators/inbox-archive-spam.locators';

export class InboxArchiveSpamPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof inboxArchiveSpamLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = inboxArchiveSpamLocators(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/inbox/archived-spam`
    );
    try {
      await this.loc.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }

  async clickArchiveTab(): Promise<void> {
    await this.loc.archiveTabBtn.click();
    await this.page.waitForTimeout(500);
  }

  async clickSpamTab(): Promise<void> {
    await this.loc.spamTabBtn.click();
    await this.page.waitForTimeout(500);
  }
}
