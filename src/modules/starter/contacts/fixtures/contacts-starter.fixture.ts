import { test as base }          from '../../../../core/fixtures/starter-base.fixture';
import { ContactsStarterPage }  from '../pages/contacts-starter.page';

type ContactsStarterFixtures = {
  contactsStarterPage: ContactsStarterPage;
};

export const test = base.extend<ContactsStarterFixtures>({
  contactsStarterPage: async ({ page }, use) => {
    await use(new ContactsStarterPage(page));
  },
});

export { expect } from '@playwright/test';
