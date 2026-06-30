import type { Page } from '@playwright/test';
import { env }                      from '../../../../../config/environment';
import { TIMEOUTS }                 from '../../../../core/constants/timeouts';
import { boardsUpgradeLocators }    from '../locators/boards-upgrade.locators';

export class BoardsUpgradePage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof boardsUpgradeLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = boardsUpgradeLocators(page);
  }

  async gotoBoards(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`
    );
    try {
      await this.loc.customBoardsLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.customBoardsLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }

  async openUpgradeModal(): Promise<void> {
    const urlBefore = this.page.url();
    await this.loc.customBoardsLink.click();
    await this.page.waitForTimeout(1_500);
    // If click navigated away (e.g. to billing), return to boards
    if (!this.page.url().includes('/tickets')) {
      await this.page.goto(urlBefore);
      await this.page.waitForTimeout(1_000);
    }
  }

  async closeModal(): Promise<void> {
    await this.loc.closeBtn.click();
    await this.loc.modal
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }
}
