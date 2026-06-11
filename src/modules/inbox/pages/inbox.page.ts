import type { Page, Locator } from '@playwright/test';
import { inboxLocators }      from '../locators/inbox.locators';
import { TIMEOUTS }           from '../../../core/constants/timeouts';
import type { InboxFilter, SnoozeOption } from '../types/inbox.types';
import { env }                from '../../../../config/environment';

export class InboxPage {
  readonly statusDropdown: Locator;
  readonly contactName:    Locator;
  readonly messageThread:  Locator;
  readonly detailPanel:    Locator;
  private loc: ReturnType<typeof inboxLocators>;

  constructor(private page: Page) {
    this.loc            = inboxLocators(page);
    this.statusDropdown = this.loc.statusDropdown;
    this.contactName    = this.loc.contactName;
    this.messageThread  = this.loc.messageThread;
    this.detailPanel    = this.loc.detailPanel;
  }

  async goto(): Promise<void> {
    const url = `${env.baseUrl}/project/${env.workspace.projectId}/inbox/${env.workspace.inboxId}/all/open`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.loc.filterAll.waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async gotoConversation(convId: string): Promise<void> {
    const url = `${env.baseUrl}/project/${env.workspace.projectId}/inbox/${env.workspace.inboxId}/all/open/ticket/${convId}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.loc.detailPanel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async applyFilter(filter: InboxFilter): Promise<void> {
    if (filter === 'mine') {
      await this.loc.filterMine.click();
    } else if (filter === 'all') {
      await this.loc.filterAll.click();
    } else {
      await this.loc.statusDropdown.click();
      const optionMap: Record<string, Locator> = {
        open:     this.loc.statusOpen,
        snoozed:  this.loc.statusSnoozed,
        closed:   this.loc.statusClosed,
        archived: this.loc.statusArchived,
      };
      await optionMap[filter].click();
    }
    await this.page.waitForTimeout(300);
  }

  async search(query: string): Promise<void> {
    await this.loc.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await this.loc.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async getConversationCount(): Promise<number> {
    return this.loc.conversationItems.count();
  }

  async snooze(option: SnoozeOption): Promise<void> {
    await this.loc.snoozeBtn.click();
    if (option === 'tomorrow') {
      await this.loc.snoozeTomorrow.click();
    }
  }

  async waitForAiResponse(): Promise<string> {
    await this.loc.aiSpinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.aiResponse });
    return (await this.loc.aiResponse.textContent()) ?? '';
  }
}
