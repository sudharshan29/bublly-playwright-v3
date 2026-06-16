import type { Page } from '@playwright/test';
import { TIMEOUTS }           from '../../../core/constants/timeouts';
import { dashboardLocators }  from '../locators/dashboard.locators';

export class DashboardPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof dashboardLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = dashboardLocators(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    try {
      await this.loc.welcomeHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await this.loc.welcomeHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
    // Wait for the two main sections to settle
    await Promise.allSettled([
      this.loc.assignedHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.element }),
      this.loc.liveFeedHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.element }),
    ]);
  }

  // ── Assigned To Me ────────────────────────────────────────────────────

  async getAssignedCount(): Promise<number> {
    // The "(N)" badge is loaded async after the heading renders;
    // create a locator that only resolves once the parenthesis is present
    const headingWithCount = this.page.getByRole('heading', { level: 2 })
      .filter({ hasText: /Assigned To Me \(/ });
    await headingWithCount.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    const text  = (await this.loc.assignedHeading.first().textContent({ timeout: 5_000 })) ?? '';
    const match = text.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getAssignedModalCount(): Promise<number> {
    const text  = (await this.loc.assignedModalTitle.textContent()) ?? '';
    const match = text.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async openViewAllModal(): Promise<void> {
    await this.loc.viewAllBtn.click();
    await this.loc.assignedModalTitle.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async closeModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.loc.assignedModal
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  // ── Workspace ─────────────────────────────────────────────────────────

  async openWorkspaceDropdown(): Promise<void> {
    await this.loc.workspaceCombobox.click();
    await this.page.waitForTimeout(500);
  }

  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  // ── Project ───────────────────────────────────────────────────────────

  async openProjectMoreOptions(): Promise<void> {
    await this.loc.projectMoreOptions.click();
    await this.page.waitForTimeout(400);
  }

  async closeContextMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  // ── Live Feed ─────────────────────────────────────────────────────────

  async getLiveFeedCount(): Promise<number> {
    return this.loc.liveFeedItems.count();
  }

  async getFirstLiveFeedTicketId(): Promise<string> {
    const first = this.loc.liveFeedItems.first();
    await first.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    const text = (await first.textContent()) ?? '';
    const match = text.match(/FRE\d+_\d+/);
    return match?.[0] ?? '';
  }

  // ── Notification Panel ────────────────────────────────────────────────

  async openNotificationPanel(): Promise<void> {
    await this.loc.notificationBell.click();
    await this.loc.notificationPanelTitle.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async closeNotificationPanel(): Promise<void> {
    // The panel ignores Escape; click the close icon button in the panel header
    await this.loc.notifCloseBtn.click({ timeout: 5_000 });
    await this.loc.notificationPanelTitle
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  // ── Global Search ─────────────────────────────────────────────────────

  async openSearch(): Promise<void> {
    await this.loc.searchBarTrigger.click();
    // Wait for the dialog input to appear (visible immediately on dialog open)
    await this.loc.searchModalInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async typeInSearch(query: string): Promise<void> {
    await this.loc.searchModalInput.pressSequentially(query, { delay: 60 });
    await this.page.waitForTimeout(800);
  }

  async closeSearch(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.loc.searchIsOpen
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }
}
