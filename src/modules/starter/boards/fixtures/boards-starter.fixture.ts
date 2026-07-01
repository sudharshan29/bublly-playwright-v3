import { test as base }                  from '../../../../core/fixtures/starter-base.fixture';
import { BoardsUpgradePage }             from '../pages/boards-upgrade.page';
import { BoardsStarterAddTicketPage }    from '../pages/boards-starter-add-ticket.page';

type BoardsStarterFixtures = {
  boardsUpgradePage:         BoardsUpgradePage;
  boardsStarterAddTicketPage: BoardsStarterAddTicketPage;
};

export const test = base.extend<BoardsStarterFixtures>({
  boardsUpgradePage: async ({ page }, use) => {
    await use(new BoardsUpgradePage(page));
  },
  boardsStarterAddTicketPage: async ({ page }, use) => {
    await use(new BoardsStarterAddTicketPage(page));
  },
});

export { expect } from '@playwright/test';
