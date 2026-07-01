import { test as base }     from '../../../../core/fixtures/starter-base.fixture';
import { ProfileMenuPage } from '../pages/profile-menu.page';

type ProfileFixtures = {
  profileMenuPage: ProfileMenuPage;
};

export const test = base.extend<ProfileFixtures>({
  profileMenuPage: async ({ page }, use) => {
    await use(new ProfileMenuPage(page));
  },
});

export { expect } from '@playwright/test';
