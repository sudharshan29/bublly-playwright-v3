import { expect, type Page, type Locator } from '@playwright/test';
import { env }              from '../../../../config/environment';
import { TIMEOUTS }         from '../../../core/constants/timeouts';
import { boardsLocators }   from '../locators/boards.locators';
import fixtureData          from '../../../../.fixtures/fixture-data.json';

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
    // Wait for board content AND sidebar simultaneously — sidebar loads from a separate API call
    // and must be ready before any test checks sidebar links (e.g. TC_BRD_005).
    // QA app can throw a Next.js client-side exception (crash page) — reload clears it.
    try {
      await Promise.all([
        this.loc.openColumnLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
        this.loc.bugBoardLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
      ]);
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await Promise.all([
        this.loc.openColumnLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
        this.loc.bugBoardLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
      ]);
    }
  }

  async gotoBugBoard():     Promise<void> { await this.goto(fixtureData.boards.bugBoardId); }
  async gotoFeatureBoard(): Promise<void> { await this.goto(fixtureData.boards.featureBoardId); }

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
    // Detect the actual current status badge rather than assuming it.
    // The panel content loads asynchronously after the panel container becomes visible,
    // so we wait for EITHER badge to appear (whichever the server returns).
    // Scope to the Status label row — the value shows "Select Status...", "Open", or "Done"
    const statusRow = this.loc.detailPanel
      .getByText('Status', { exact: true })
      .locator('..');
    const badge = statusRow
      .locator('p, span, button, div, [role="combobox"]')
      .filter({ hasText: /Open|Done|Select/i })
      .first();
    await badge.waitFor({ state: 'visible', timeout: TIMEOUTS.slow });

    const currentText = (await badge.textContent())?.trim() ?? '';
    if (currentText === targetStatus) return; // already in target state

    await badge.click();

    // Dropdown opens — select the target column status
    const option = this.page
      .getByRole('option', { name: targetStatus, exact: true })
      .or(this.page.locator('li, div[role="option"]').filter({ hasText: new RegExp(`^${targetStatus}$`) }).first());
    await option.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slow });
    await option.first().click();

    // Wait for badge to reflect the new status — confirms server-side update received
    await expect(badge).toContainText(targetStatus, { timeout: TIMEOUTS.element });
  }

  // ── Search ────────────────────────────────────────────────────────────

  async openSearch(): Promise<void> {
    await this.loc.searchIcon.click();
    await this.loc.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async search(query: string): Promise<void> {
    await this.openSearch();
    await this.loc.searchInput.fill(query);
    await this.loc.searchInput.press('Enter');
  }

  async clearSearch(): Promise<void> {
    await this.loc.searchInput.clear();
    await this.loc.searchInput.fill('');
    await this.loc.searchInput.press('Enter');
    await this.page.keyboard.press('Escape');
    await this.loc.searchInput.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
  }

  // ── Sort ──────────────────────────────────────────────────────────────

  async openSort(): Promise<void> {
    await this.loc.sortIcon.click();
    await this.loc.sortApplyBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async applySort(option: 'Created Date' | 'Due Date' | 'Assignee' | 'Priority'): Promise<void> {
    if (option === 'Created Date') await this.loc.sortCreatedDate.click();
    else if (option === 'Due Date') await this.loc.sortDueDate.click();
    else if (option === 'Assignee') await this.loc.sortAssignee.click();
    else                            await this.loc.sortPriority.click();
    await this.loc.sortApplyBtn.click();
    await this.loc.sortApplyBtn.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
  }

  async clearSort(): Promise<void> {
    await this.loc.sortClearBtn.click();
    await this.loc.sortClearBtn.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
  }

  // ── Filter ────────────────────────────────────────────────────────────

  async openFilter(): Promise<void> {
    await this.loc.filterIcon.click();
    await this.loc.filterApplyBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async applyFilter(): Promise<void> {
    await this.loc.filterApplyBtn.click();
    await this.loc.filterApplyBtn.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
  }

  async clearFilter(): Promise<void> {
    await this.loc.filterClearBtn.click();
    await this.loc.filterClearBtn.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
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
    // Save button starts disabled — wait for it to become enabled before clicking.
    await this.loc.settingsSaveBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await expect(this.loc.settingsSaveBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await this.loc.settingsSaveBtn.click();
    await this.loc.settingsModalTitle
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  // Clicks "+ Add column" in the settings modal and optionally names the new column.
  // Uses pressSequentially (not fill) so React's onChange fires and enables Save.
  async addColumn(name?: string): Promise<void> {
    await this.loc.settingsAddColumnBtn.click();
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
      // pressSequentially fires native key events per character — triggers React onChange.
      // Triple-click first to select any placeholder text before typing.
      await newInput.click({ clickCount: 3 });
      await newInput.fill(name);  // fill() triggers React's synthetic onChange via input events
      // Tab triggers blur/focusout so React commits the value and enables Save
      await newInput.press('Tab');
      // Allow time for React to process the value change before caller checks Save state
      await this.page.waitForTimeout(500);
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
      // Delete all duplicates (parallel workers may have added the same column multiple times)
      let currentIdx = idx;
      while (currentIdx >= 0) {
        const input = this.page.locator('input').nth(currentIdx);
        await input.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
        await input.scrollIntoViewIfNeeded();
        const row = input.locator('..');
        await row.locator('button').last().click({ timeout: TIMEOUTS.action });
        await input.waitFor({ state: 'hidden', timeout: TIMEOUTS.element }).catch(() => {});
        currentIdx = await this.page.evaluate((colName) => {
          const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
          return inputs.findIndex((i) => i.value === colName);
        }, name);
      }
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
    await this.loc.addBugModalTitle.or(this.loc.addFeatureModalTitle).first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async openAddTicketOnFeatureBoard(): Promise<void> {
    await this.gotoFeatureBoard();
    await this.loc.openColumnAddBtn.click();
    await this.loc.addFeatureModalTitle.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  // Creates a ticket on the Open column and returns a locator for its card.
  // The QA `POST /tickets/create_ticket` endpoint intermittently responds with a 500
  // (backend flakiness, not a UI bug) and silently drops the ticket — retry the whole
  // create flow a few times before giving up, rather than failing on one transient error.
  // NOTE: uses expect(...).toBeVisible() (not locator.isVisible()) because isVisible()'s
  // `timeout` option is a no-op — it checks the DOM once and returns immediately, so it
  // can't tell "not created" apart from "created but not rendered yet".
  async addTicketAndGetCard(title: string, maxAttempts = 3): Promise<Locator> {
    const card = this.loc.ticketCards.filter({ hasText: title }).first();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.openAddTicketOnOpenColumn();
      await this.loc.addTicketTitleInput.fill(title);
      await this.loc.addTicketSubmitBtn.click();
      try {
        await expect(card).toBeVisible({ timeout: 8_000 });
        return card;
      } catch {
        // Submit likely failed server-side (500) — close any lingering modal and retry.
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(500);
      }
    }
    throw new Error(
      `Ticket "${title}" did not appear on the board after ${maxAttempts} create attempts ` +
      `(QA create_ticket endpoint may be failing).`,
    );
  }

  // Deletes the ticket currently open in the detail panel via the kebab ("more options")
  // menu → "Delete Ticket" → confirm. The QA `POST /tickets/update_ticket` endpoint used
  // for delete reliably responds with a 500 yet the deletion is still applied server-side —
  // the board list is not optimistically updated, so callers must reload to observe removal.
  async deleteCurrentTicketViaDetailPanel(): Promise<void> {
    await this.loc.detailMoreOptionsBtn.click();
    await this.loc.deleteTicketMenuItem.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await this.loc.deleteTicketMenuItem.click();
    await this.loc.deleteConfirmBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await this.loc.deleteConfirmBtn.click();
  }
}
