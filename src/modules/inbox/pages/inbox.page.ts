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
    // Wait for the inbox list panel (filterAll) to confirm app has loaded, then wait for detail panel
    await this.loc.filterAll.waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async applyFilter(filter: InboxFilter): Promise<void> {
    if (filter === 'mine') {
      await this.loc.filterMine.click();
      await this.page.waitForTimeout(300);
      return;
    }
    if (filter === 'all') {
      await this.loc.filterAll.click();
      await this.page.waitForTimeout(300);
      return;
    }
    // For status filters (open/snoozed/closed/archived), navigate directly via URL.
    // The status dropdown is unreliable in QA — it can trigger a client-side crash.
    // URL pattern: /project/{id}/inbox/{id}/all/{status}
    const statusUrlMap: Record<string, string> = {
      open:     'open',
      snoozed:  'snoozed',
      closed:   'closed',
      archived: 'archived',
    };
    const statusSegment = statusUrlMap[filter] ?? 'open';
    const url = `${env.baseUrl}/project/${env.workspace.projectId}/inbox/${env.workspace.inboxId}/all/${statusSegment}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.loc.filterAll.waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async search(query: string): Promise<void> {
    // The "Search here" bar is a clickable div; clicking it reveals the actual text input
    const trigger = this.loc.searchTrigger;
    const isVisible = await trigger.isVisible().catch(() => false);
    if (isVisible) {
      await trigger.click();
      await this.page.waitForTimeout(300);
    }
    await this.loc.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    // Search stays active after typing — navigate back to the open inbox URL to reset
    await this.goto();
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
