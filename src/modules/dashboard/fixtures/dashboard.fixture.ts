import { test as base }    from '../../../core/fixtures/base.fixture';
import { DashboardPage }   from '../pages/dashboard.page';

type DashboardFixtures = {
  dashboardPage: DashboardPage;
};

export const test = base.extend<DashboardFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
