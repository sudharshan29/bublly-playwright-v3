import type { Page } from '@playwright/test';
import { env }              from '../../../../config/environment';
import { TIMEOUTS }         from '../../../core/constants/timeouts';
import { boardsLocators }   from '../locators/boards.locators';

export class BoardsPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof boardsLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = boardsLocators(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async goto(boardId: string | number): Promise<void> {
    await this.page.goto(`/project/${env.workspace.projectId}/tickets/${boardId}`);
    // networkidle is unreliable with the app's persistent WebSocket — wait for element instead
    await this.loc.openColumnLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async gotoBugBoard():     Promise<void> { await this.goto(1895); }
  async gotoFeatureBoard(): Promise<void> { await this.goto(1896); }

  // ── Column counts ─────────────────────────────────────────────────────

  async getColumnCount(column: 'Open' | 'Done'): Promise<number> {
    // Column header structure: parent div → [p "Open", p "417"]
    // Go up one level from the label paragraph and read the sibling count paragraph
    const label  = this.page.locator('p').filter({ hasText: new RegExp(`^${column}$`) }).first();
    const parent = label.locator('..');
    const all    = await parent.locator('p').all();
    for (const p of all) {
      const n = parseInt((await p.textContent())?.trim() ?? '', 10);
      if (!isNaN(n)) return n;
    }
    return 0;
  }

  // ── Ticket cards ──────────────────────────────────────────────────────

  async openTicketCard(ticketId: string): Promise<void> {
    const card = this.page.getByRole('button').filter({ hasText: ticketId }).first();
    await card.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await card.click();
    await this.loc.detailPanel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  // Opens the first available ticket in the Open column and returns its ticket ID string
  async openFirstTicketCard(): Promise<string> {
    const first = this.loc.ticketCards.first();
    await first.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    const text  = (await first.textContent()) ?? '';
    await first.click();
    await this.loc.detailPanel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    const match = text.match(/FRE\d+_\d+/);
    return match?.[0] ?? '';
  }

  async closeDetailPanel(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.loc.detailPanel
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  // ── Status change ─────────────────────────────────────────────────────

  async setStatus(targetStatus: 'Open' | 'Done'): Promise<void> {
    const currentStatus = targetStatus === 'Done' ? 'Open' : 'Done';

    // Click the current-status badge inside the detail panel to open the dropdown
    const badge = this.loc.detailPanel
      .locator('p, span, button')
      .filter({ hasText: new RegExp(`^${currentStatus}$`) })
      .first();
    await badge.waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await badge.click();

    await this.page.waitForTimeout(400);

    // Radix / custom dropdown: select the target option
    const option = this.page
      .getByRole('option', { name: targetStatus, exact: true })
      .or(this.page.getByLabel(targetStatus).getByText(targetStatus).first());
    await option.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await option.first().click();

    // Give the server a moment to process the status change
    await this.page.waitForTimeout(1_500);
  }

  // ── Search ────────────────────────────────────────────────────────────

  async openSearch(): Promise<void> {
    await this.loc.searchIcon.click();
    await this.loc.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async search(query: string): Promise<void> {
    await this.openSearch();
    await this.loc.searchInput.fill(query);
    await this.page.waitForTimeout(1_000);
  }

  async clearSearch(): Promise<void> {
    // Clear the input text directly, then press Escape to close the search bar
    await this.loc.searchInput.clear();
    await this.page.waitForTimeout(300);
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(1_500);
  }

  // ── Sort ──────────────────────────────────────────────────────────────

  async openSort(): Promise<void> {
    await this.loc.sortIcon.click();
    await this.page.waitForTimeout(400);
  }

  async applySort(option: 'Created Date' | 'Due Date' | 'Assignee' | 'Priority'): Promise<void> {
    if (option === 'Created Date') await this.loc.sortCreatedDate.click();
    else if (option === 'Due Date') await this.loc.sortDueDate.click();
    else if (option === 'Assignee') await this.loc.sortAssignee.click();
    else                            await this.loc.sortPriority.click();
    await this.loc.sortApplyBtn.click();
    await this.page.waitForTimeout(1_000);
  }

  async clearSort(): Promise<void> {
    await this.loc.sortClearBtn.click();
    await this.page.waitForTimeout(500);
  }

  // ── Filter ────────────────────────────────────────────────────────────

  async openFilter(): Promise<void> {
    await this.loc.filterIcon.click();
    await this.page.waitForTimeout(400);
  }

  async applyFilter(): Promise<void> {
    await this.loc.filterApplyBtn.click();
    await this.page.waitForTimeout(1_000);
  }

  async clearFilter(): Promise<void> {
    await this.loc.filterClearBtn.click();
    await this.page.waitForTimeout(2_000);
  }

  // ── Settings ──────────────────────────────────────────────────────────

  async openSettings(): Promise<void> {
    await this.loc.settingsIcon.click();
    await this.loc.settingsModalTitle.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async closeSettings(): Promise<void> {
    await this.loc.settingsCloseBtn.click();
    await this.loc.settingsModalTitle
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  async saveSettings(): Promise<void> {
    // Save button starts disabled; it becomes enabled once changes are confirmed.
    // Poll up to 10 s rather than clicking immediately and timing out.
    await this.loc.settingsSaveBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    for (let i = 0; i < 20; i++) {
      if (await this.loc.settingsSaveBtn.isEnabled()) break;
      await this.page.waitForTimeout(500);
    }
    await this.loc.settingsSaveBtn.click();
    await this.loc.settingsModalTitle
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  // Clicks "+ Add column" in the settings modal and optionally names the new column.
  // Uses pressSequentially (not fill) so React's onChange fires and enables Save.
  async addColumn(name?: string): Promise<void> {
    await this.loc.settingsAddColumnBtn.click();
    await this.page.waitForTimeout(500);
    if (name) {
      // Scope to the modal via the Close button anchor; the new column input is the
      // LAST <input> inside the same div that holds the close button.
      const newInput = this.page
        .locator('button[aria-label="Close dialog"]')
        .locator('..')
        .locator('input')
        .last();
      await newInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
      await newInput.clear();
      // pressSequentially dispatches key events per character so React's onChange
      // fires and marks the form as dirty, enabling the Save button.
      await newInput.pressSequentially(name, { delay: 40 });
      // Click elsewhere in the modal to trigger blur/onChange on the column input
      await this.loc.settingsModalTitle.click();
      await this.page.waitForTimeout(600);
    }
  }

  // Deletes a custom column from settings by name.
  // Handles two cases: column shown as <input> (newly added, same session) OR
  // as display text (existing column in re-opened modal).
  async deleteColumn(name: string): Promise<void> {
    // Approach 1: column is an editable input (newly added before modal was closed)
    const idx = await this.page.evaluate((colName) => {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
      return inputs.findIndex((i) => i.value === colName);
    }, name);

    if (idx >= 0) {
      const input = this.page.locator('input').nth(idx);
      await input.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
      const row = input.locator('..');
      await row.locator('button').last().click();
      await this.page.waitForTimeout(500);
      return;
    }

    // Approach 2: column is a display-text element in the settings modal.
    // Scope the search to the settings modal ONLY so we don't accidentally click
    // buttons in the board column header area that also shows the same text.
    await this.page.evaluate((colName) => {
      // Find the modal root by anchoring to the "Board Management Settings" title leaf,
      // then walking up to the first ancestor that also contains the column text.
      const titleEl = Array.from(document.querySelectorAll<Element>('*')).find(
        (el) => el.childElementCount === 0 && el.textContent?.trim() === 'Board Management Settings'
      );
      if (!titleEl) return;

      let modalRoot: Element | null = titleEl.parentElement;
      while (modalRoot && modalRoot !== document.body) {
        if (modalRoot.textContent?.includes(colName)) break;
        modalRoot = modalRoot.parentElement;
      }
      if (!modalRoot || modalRoot === document.body) return;

      // Walk text nodes inside the modal root only
      const walker = document.createTreeWalker(modalRoot, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text)) {
        if (node.textContent?.trim() !== colName) continue;
        let el: Element | null = node.parentElement;
        for (let depth = 0; depth < 8; depth++) {
          if (!el || el === modalRoot) break;
          const btns = Array.from(el.querySelectorAll<HTMLElement>('button, [role="button"]'));
          const deleteBtn = btns.find(
            (b) => !b.textContent?.trim().match(/^(save|close|cancel|add column)$/i)
          );
          if (deleteBtn) {
            deleteBtn.click();
            return;
          }
          el = el.parentElement;
        }
      }
    }, name);

    await this.page.waitForTimeout(500);
  }

  // ── Add-ticket modals ─────────────────────────────────────────────────

  async openAddTicketOnOpenColumn(): Promise<void> {
    await this.loc.openColumnAddBtn.click();
    await this.page.waitForTimeout(1_000);
  }

  async openAddTicketOnFeatureBoard(): Promise<void> {
    await this.gotoFeatureBoard();
    await this.loc.openColumnAddBtn.click();
    await this.page.waitForTimeout(1_000);
  }
}
