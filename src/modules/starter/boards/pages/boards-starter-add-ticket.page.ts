import type { Page } from '@playwright/test';
import { env }                              from '../../../../../config/environment';
import { TIMEOUTS }                         from '../../../../core/constants/timeouts';
import { boardsStarterAddTicketLocators }   from '../locators/boards-starter-add-ticket.locators';

export class BoardsStarterAddTicketPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof boardsStarterAddTicketLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = boardsStarterAddTicketLocators(page);
  }

  async gotoBugBoard(): Promise<void> {
    await this.page.goto(
      `/project/${env.starter.projectId}/tickets/${env.starter.boardId}`
    );
    try {
      await this.loc.bugBoardLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.bugBoardLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
    await this.loc.bugBoardLink.click();
    // Wait for both the column label AND the add button to be ready before any test action
    await this.loc.openColumnLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    await this.loc.openColumnAddBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async openAddTicketModal(): Promise<void> {
    await this.loc.openColumnAddBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
    await this.loc.openColumnAddBtn.click();
    await this.page.waitForTimeout(1_500);
  }

  async getColumnCount(column: 'Open' | 'Done'): Promise<number> {
    const label  = this.page.locator('p').filter({ hasText: new RegExp(`^${column}$`) }).first();
    const parent = label.locator('..');
    const all    = await parent.locator('p').all();
    for (const p of all) {
      const n = parseInt((await p.textContent())?.trim() ?? '', 10);
      if (!isNaN(n)) return n;
    }
    return 0;
  }
}
