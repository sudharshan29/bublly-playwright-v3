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
  readonly moreOptionsBtn: Locator;
  readonly setUnreadBtn:   Locator;
  readonly copyLinkBtn:    Locator;
  readonly priorityCombo:  Locator;
  readonly detailsTab:     Locator;
  readonly noteTextbox:    Locator;
  private loc: ReturnType<typeof inboxLocators>;

  constructor(private page: Page) {
    this.loc            = inboxLocators(page);
    this.statusDropdown = this.loc.statusDropdown;
    this.contactName    = this.loc.contactName;
    this.messageThread  = this.loc.messageThread;
    this.detailPanel    = this.loc.detailPanel;
    this.moreOptionsBtn = this.loc.moreOptionsBtn;
    this.setUnreadBtn   = this.loc.setUnreadBtn;
    this.copyLinkBtn    = this.loc.copyLinkBtn;
    this.priorityCombo  = this.loc.priorityCombo;
    this.detailsTab     = this.loc.detailsTab;
    this.noteTextbox    = this.loc.noteTextbox;
  }

  async goto(): Promise<void> {
    const url = `${env.baseUrl}/project/${env.workspace.projectId}/inbox/${env.workspace.inboxId}/all/open`;
    // Short first-try goto (30s) leaves room for the retry within the 90s test timeout.
    // The prior 60s timeout consumed the entire budget before the retry could fire.
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    } catch {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    }
    // Wait for page structure — statusDropdown (combobox) is always present even in empty-inbox state.
    // On QA, the React app can stall waiting for slow API responses. Reload clears the stall.
    try {
      await this.loc.statusDropdown.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await this.loc.statusDropdown.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
    // Wait for inbox data — either conversation items or the empty state message
    await Promise.race([
      this.loc.conversationItems.first().waitFor({ state: 'visible', timeout: 15_000 }),
      this.page.getByText('Inbox zero').waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {});
  }

  async gotoConversation(convId: string, status: 'open' | 'closed' | 'archived' | 'snoozed' = 'open'): Promise<void> {
    const url = `${env.baseUrl}/project/${env.workspace.projectId}/inbox/${env.workspace.inboxId}/all/${status}/ticket/${convId}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    // Wait for the detail panel — on QA, the React app can stall on slow API responses.
    // A reload clears the stall without requiring an arbitrarily long timeout.
    try {
      await this.loc.detailPanel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
      await this.loc.detailPanel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
    // Wait for conversation content — both areas load from separate API calls.
    // Use allSettled so a slow QA server can't block both; each waits independently.
    await Promise.allSettled([
      this.page.locator('[role="textbox"][aria-multiline="true"]').first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
      this.page.getByRole('button', { name: 'Details', exact: true })
        .waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
    ]);
  }

  async applyFilter(filter: InboxFilter): Promise<void> {
    if (filter === 'mine') {
      await this.loc.filterMine.click();
      // Actual URL segment is /my-inbox/ — not /mine/
      await this.page.waitForURL(/\/my-inbox\//, { timeout: 20_000 });
      return;
    }
    if (filter === 'all') {
      await this.loc.filterAll.click();
      await this.page.waitForURL(/\/all\//, { timeout: 20_000 });
      return;
    }
    if (filter === 'unassigned') {
      await this.loc.filterUnassigned.click();
      await this.page.waitForURL(/\/unassigned\//, { timeout: 20_000 });
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
    // Wait for conversation items or empty state — same pattern as goto()
    await Promise.race([
      this.loc.conversationItems.first().waitFor({ state: 'visible', timeout: 15_000 }),
      this.page.getByText('Inbox zero').waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {});
  }

  async search(query: string): Promise<void> {
    // The "Search here" bar is a clickable div; clicking it reveals the actual text input
    const trigger = this.loc.searchTrigger;
    const isVisible = await trigger.isVisible().catch(() => false);
    if (isVisible) {
      await trigger.click();
      await this.loc.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    }
    await this.loc.searchInput.fill(query);
    // Press Enter to immediately submit — bypasses the app's debounce timer
    await this.loc.searchInput.press('Enter');
    // Wait for search results to arrive (API call + render)
    await this.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  }

  async clearSearch(): Promise<void> {
    // Search stays active after typing — navigate back to the open inbox URL to reset
    await this.goto();
  }

  async getConversationCount(): Promise<number> {
    return this.loc.conversationItems.count();
  }

  async openNewConversationModal(): Promise<void> {
    await this.loc.newConversationBtn.click();
    // Modal opening fetches inbox/channel data — use navigation timeout (45s) for slow QA server
    await this.loc.newConvModal.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async clickInboxSettings(): Promise<void> {
    await this.loc.inboxSettingsLink.click();
    await this.page.getByRole('heading', { name: 'Inbox Settings' }).waitFor({ state: 'visible', timeout: 10_000 });
  }

  async snooze(option: SnoozeOption): Promise<void> {
    await this.loc.snoozeBtn.click();
    if (option === 'tomorrow') {
      await this.loc.snoozeTomorrow.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
      await this.loc.snoozeTomorrow.click();
    } else if (option === 'next-week') {
      await this.loc.snoozeNextWeek.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
      await this.loc.snoozeNextWeek.click();
    }
    // 'custom' leaves the menu open — caller is responsible for closing it
  }

  async openSnoozeMenu(): Promise<void> {
    await this.loc.snoozeBtn.click();
    // Snooze menu opens as a dialog — wait for any option to confirm it rendered
    await this.loc.snoozeTomorrow.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
  }

  async closeConversation(): Promise<void> {
    // Close Conversation is in the More Options menu and requires a confirmation dialog
    await this.loc.moreOptionsBtn.click();
    await this.loc.closeConvMenuItem.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
    await this.loc.closeConvMenuItem.click();
    // Confirmation dialog: click the "Close" button to confirm
    await this.loc.closeConfirmBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.action });
    await this.loc.closeConfirmBtn.click();
    await this.page.waitForTimeout(2_000);
  }

  async archiveConversation(): Promise<void> {
    // Archive Ticket is in the More Options menu and acts immediately (no confirmation)
    // It is a toggle: clicking again on an archived ticket restores it to open
    await this.loc.moreOptionsBtn.click();
    const appeared = await this.loc.archiveTicketMenuItem
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true).catch(() => false);

    if (!appeared) {
      // Menu didn't open — Escape clears any partial state, then retry the click
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
      await this.loc.moreOptionsBtn.click();
      await this.loc.archiveTicketMenuItem.waitFor({ state: 'visible', timeout: 20_000 });
    }

    await this.loc.archiveTicketMenuItem.click();
    await this.page.waitForTimeout(2_000);
  }

  async waitForAiResponse(): Promise<string> {
    await this.loc.aiSpinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.aiResponse });
    return (await this.loc.aiResponse.textContent()) ?? '';
  }
}
