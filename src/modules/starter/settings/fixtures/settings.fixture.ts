import { test as base, expect } from '../../../../core/fixtures/starter-base.fixture';
import { SettingsPage } from '../pages/settings.page';

type SettingsFixtures = {
  settingsPage: SettingsPage;
};

export const test = base.extend<SettingsFixtures>({
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
});

export { expect };
