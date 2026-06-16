import { test as base } from '../../../core/fixtures/base.fixture';
import { BoardsPage }   from '../pages/boards.page';

type BoardsFixtures = {
  boardsPage: BoardsPage;
};

export const test = base.extend<BoardsFixtures>({
  boardsPage: async ({ page }, use) => {
    await use(new BoardsPage(page));
  },
});

export { expect } from '@playwright/test';
