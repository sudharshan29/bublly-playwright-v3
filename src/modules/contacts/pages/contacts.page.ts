import type { Page } from '@playwright/test';
import { TIMEOUTS }          from '../../../core/constants/timeouts';
import { contactsLocators }  from '../locators/contacts.locators';

export class ContactsPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof contactsLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = contactsLocators(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/contacts');
    await this.loc.pageHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    await this.loc.contactTable.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  async gotoContact(id: string | number): Promise<void> {
    await this.page.goto(`/contacts/users/${id}`);
    try {
      await this.loc.userDetailHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.loc.userDetailHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    }
  }

  // ── Sidebar ───────────────────────────────────────────────────────────

  async clickSidebarAll():          Promise<void> { await this.loc.sidebarAll.click(); }
  async clickSidebarUsers():        Promise<void> { await this.loc.sidebarUsers.click(); }
  async clickSidebarGuests():       Promise<void> { await this.loc.sidebarGuests.click(); }
  async clickSidebarUnsubscribed(): Promise<void> { await this.loc.sidebarUnsubscribed.click(); }
  async clickSidebarBlocked():      Promise<void> { await this.loc.sidebarBlocked.click(); }

  // ── Search ────────────────────────────────────────────────────────────

  async openSearch(): Promise<void> {
    await this.loc.filterIconBtn.click();
    await this.loc.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async search(query: string): Promise<void> {
    await this.openSearch();
    // pressSequentially fires key events so React's onChange handler updates the URL
    await this.loc.searchInput.pressSequentially(query, { delay: 40 });
    await this.page.waitForTimeout(800);
  }

  async clearSearch(): Promise<void> {
    await this.loc.searchClearBtn.click();
    await this.page.waitForTimeout(600);
  }

  // ── Add Contact modal ─────────────────────────────────────────────────

  async openAddContactModal(): Promise<void> {
    await this.loc.addContactBtn.click();
    await this.loc.addContactModal.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async closeAddContactModal(): Promise<void> {
    await this.loc.addContactCloseBtn.click();
    await this.loc.addContactModal
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  async addContact(name: string, email: string): Promise<void> {
    await this.openAddContactModal();
    await this.loc.addContactNameInput.fill(name);
    await this.loc.addContactEmailInput.fill(email);
    await this.loc.addContactSubmitBtn.click();
    await this.page.waitForTimeout(1_500);
    // Dismiss modal if it's still open (server may not auto-close it)
    const stillOpen = await this.loc.addContactModal
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (stillOpen) {
      await this.loc.addContactCloseBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────

  async getTotalCount(): Promise<number> {
    const text = (await this.loc.paginationInfo.textContent()) ?? '';
    const match = text.match(/of\s+([\d,]+)\s+results/);
    return match ? parseInt(match[1].replace(',', ''), 10) : 0;
  }

  // ── Contact detail actions ────────────────────────────────────────────

  async clickBlock(): Promise<void> {
    await this.loc.blockAction.click();
    await this.loc.blockDialogHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async cancelBlock(): Promise<void> {
    await this.loc.blockCancelBtn.click();
    await this.loc.blockDialogHeading
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  async toggleUnsubscribe(): Promise<void> {
    await this.loc.unsubscribeAction.click();
    await this.page.waitForTimeout(600);
  }

  async toggleMute(): Promise<void> {
    await this.loc.muteAction.click();
    await this.page.waitForTimeout(600);
  }

  async openNewConversation(): Promise<void> {
    await this.loc.newConversationBtn.click();
    await this.loc.newConvModalHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }

  async closeNewConversation(): Promise<void> {
    await this.loc.newConvCloseBtn.click();
    await this.loc.newConvModalHeading
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.action })
      .catch(() => {});
  }

  // ── Column settings ───────────────────────────────────────────────────

  async openColumnSettings(): Promise<void> {
    await this.loc.columnSettingsBtn.click();
    await this.loc.colOptionName.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  }
}
