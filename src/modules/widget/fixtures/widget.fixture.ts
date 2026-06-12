// Raw @playwright/test — widget tests run as an anonymous visitor, not an agent.
// Using base.fixture here would inject agent auth tokens, which must not happen
// on the customer-facing Help Center / widget.
import { test as base } from '@playwright/test';
import { WidgetPage }   from '../pages/widget.page';

type WidgetFixtures = {
  widgetPage: WidgetPage;
};

export const test = base.extend<WidgetFixtures>({
  widgetPage: async ({ page }, use) => {
    await use(new WidgetPage(page));
  },
});

export { expect } from '@playwright/test';
