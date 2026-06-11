import { test as base }    from '../../../core/fixtures/base.fixture';
import { InboxPage }       from '../pages/inbox.page';
import { InboxDataHelper } from '../helpers/inbox.data';

type InboxFixtures = {
  inboxPage: InboxPage;
  inboxData: InboxDataHelper;
};

export const test = base.extend<InboxFixtures>({
  inboxPage: async ({ page }, use) => {
    await use(new InboxPage(page));
  },
  inboxData: async ({ page }, use) => {
    await use(new InboxDataHelper(page));
  },
});

export { expect } from '@playwright/test';
