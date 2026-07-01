import { test as base }           from '../../../../core/fixtures/starter-base.fixture';
import { InboxArchiveSpamPage }   from '../pages/inbox-archive-spam.page';
import { InboxSettingsModalPage } from '../pages/inbox-settings-modal.page';
import { InboxGroupsPage }        from '../pages/inbox-groups.page';
import { InboxCustomViewPage }    from '../pages/inbox-custom-view.page';

type InboxStarterFixtures = {
  archivePage:         InboxArchiveSpamPage;
  inboxSettingsPage:   InboxSettingsModalPage;
  inboxGroupsPage:     InboxGroupsPage;
  inboxCustomViewPage: InboxCustomViewPage;
};

export const test = base.extend<InboxStarterFixtures>({
  archivePage: async ({ page }, use) => {
    await use(new InboxArchiveSpamPage(page));
  },
  inboxSettingsPage: async ({ page }, use) => {
    await use(new InboxSettingsModalPage(page));
  },
  inboxGroupsPage: async ({ page }, use) => {
    await use(new InboxGroupsPage(page));
  },
  inboxCustomViewPage: async ({ page }, use) => {
    await use(new InboxCustomViewPage(page));
  },
});

export { expect } from '@playwright/test';
