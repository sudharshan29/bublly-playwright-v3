import { test as base }   from '../../../core/fixtures/base.fixture';
import { ContactsPage }   from '../pages/contacts.page';

type ContactsFixtures = {
  contactsPage: ContactsPage;
};

export const test = base.extend<ContactsFixtures>({
  contactsPage: async ({ page }, use) => {
    await use(new ContactsPage(page));
  },
});

export { expect } from '@playwright/test';
