import type { Page } from '@playwright/test';
import { env }                         from '../../../../../config/environment';
import { TIMEOUTS }                    from '../../../../core/constants/timeouts';
import { inboxCustomViewLocators }     from '../locators/inbox-custom-view.locators';

export class InboxCustomViewPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof inboxCustomViewLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = inboxCustomViewLocators(page);
  }

  async gotoInbox(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`
    );
    try {
      await this.loc.customViewSidebarItem.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.customViewSidebarItem.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }
}
