import type { Page } from '@playwright/test';
import { TIMEOUTS }                     from '../../../../core/constants/timeouts';
import { contactsStarterLocators }      from '../locators/contacts-starter.locators';

export class ContactsStarterPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof contactsStarterLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = contactsStarterLocators(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/contacts');
    await this.page.waitForURL(/contacts/, { timeout: TIMEOUTS.navigation });
    // Page is ready when either the table OR the empty-state "No records found" text appears.
    // Waiting for the table alone times out on slow QA when 0 contacts exist.
    try {
      await Promise.race([
        this.loc.contactTable.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
        this.page.getByText('No records found', { exact: true }).waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
      ]);
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await Promise.race([
        this.loc.contactTable.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
        this.page.getByText('No records found', { exact: true }).waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
      ]);
    }
  }

  async searchContact(query: string): Promise<void> {
    await this.loc.searchInput.fill(query);
    await this.page.waitForTimeout(600);
  }
}
