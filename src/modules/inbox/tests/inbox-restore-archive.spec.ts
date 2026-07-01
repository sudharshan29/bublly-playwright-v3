import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Serial: TC_ARCH_009 restores the archived fixture ticket; TC_ARCH_010 re-archives it.
// All three tests operate on the same conversation — order is load-bearing.
test.describe.configure({ mode: 'serial' });

test.describe('Inbox restore from archive — TC_ARCH_008-010 @smoke', () => {
  test.setTimeout(120_000);

  test('TC_ARCH_008 archived ticket loads in archived view with detail panel visible', async ({ inboxPage, page }) => {
    await inboxPage.gotoConversation(conversations.archived, 'archived');
    await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });
    await expect(inboxPage.moreOptionsBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC_ARCH_009 Archive Ticket toggle restores an archived ticket to open state', async ({ inboxPage, page }) => {
    await inboxPage.gotoConversation(conversations.archived, 'archived');

    // Archive Ticket is a toggle — on an archived ticket this restores it to open
    await inboxPage.archiveConversation();

    // After restore, the ticket must be reachable in open state with composer visible
    await inboxPage.gotoConversation(conversations.archived, 'open');
    await expect(
      page.locator('[role="textbox"][aria-multiline="true"]').first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('TC_ARCH_010 re-archive restored ticket to reset fixture back to archived state', async ({ inboxPage, page }) => {
    await inboxPage.gotoConversation(conversations.archived, 'open');

    // Toggle again — archives the now-open ticket, restoring the original fixture state
    await inboxPage.archiveConversation();

    // Confirm ticket is back in archived view
    await inboxPage.gotoConversation(conversations.archived, 'archived');
    await expect(inboxPage.detailPanel).toBeVisible({ timeout: 20_000 });
  });
});
