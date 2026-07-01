import type { Page } from '@playwright/test';
import { env }                      from '../../../../../config/environment';
import { TIMEOUTS }                 from '../../../../core/constants/timeouts';
import { inboxGroupsLocators }      from '../locators/inbox-groups.locators';

export class InboxGroupsPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof inboxGroupsLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = inboxGroupsLocators(page);
  }

  async gotoInbox(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/inbox/${env.starter.inboxId}`
    );
    try {
      await this.loc.groupsSidebarItem.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.groupsSidebarItem.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }
}
