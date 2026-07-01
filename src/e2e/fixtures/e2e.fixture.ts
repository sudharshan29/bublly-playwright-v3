import { test as base }   from '../../core/fixtures/base.fixture';
import { DashboardPage }  from '../../modules/dashboard/pages/dashboard.page';
import { InboxPage }      from '../../modules/inbox/pages/inbox.page';
import { BoardsPage }     from '../../modules/boards/pages/boards.page';
import { ContactsPage }   from '../../modules/contacts/pages/contacts.page';

type E2EFixtures = {
  dashboardPage: DashboardPage;
  inboxPage:     InboxPage;
  boardsPage:    BoardsPage;
  contactsPage:  ContactsPage;
};

// Composes all module page objects into a single fixture for cross-module E2E tests.
// Each page object gets the same authenticated page — no separate contexts needed.
export const test = base.extend<E2EFixtures>({
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  inboxPage:     async ({ page }, use) => { await use(new InboxPage(page)); },
  boardsPage:    async ({ page }, use) => { await use(new BoardsPage(page)); },
  contactsPage:  async ({ page }, use) => { await use(new ContactsPage(page)); },
});

export { expect } from '@playwright/test';
