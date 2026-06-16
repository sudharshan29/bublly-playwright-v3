import { test, expect } from '../fixtures/inbox.fixture';
import fixtureData       from '../../../../.fixtures/fixture-data.json';

const { conversations } = fixtureData;

// Priority uses Radix UI Select — options: High, Medium, Low.
// Serial: TC_INB_056 relies on TC_INB_055 having set High first.
// Fixture open (7555) starts with "Select Priority ..." — restored to Medium at end.
test.describe.configure({ mode: 'serial' });

test.describe('Inbox priority selection — TC_INB_055-056 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_INB_055 set Priority to High in the Details panel', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    const combobox = inboxPage.priorityCombo;
    await combobox.waitFor({ state: 'visible', timeout: 20_000 });
    await combobox.click();

    const highOption = page.getByRole('option', { name: 'High', exact: true });
    await highOption.waitFor({ state: 'visible', timeout: 10_000 });
    await highOption.click();

    await expect(combobox).toContainText('High', { timeout: 8_000 });
  });

  test('TC_INB_056 change Priority from High to Low then restore to Medium', async ({ page, inboxPage }) => {
    await inboxPage.gotoConversation(conversations.open);

    const combobox = inboxPage.priorityCombo;
    await combobox.waitFor({ state: 'visible', timeout: 20_000 });

    // Change High → Low
    await combobox.click();
    const lowOption = page.getByRole('option', { name: 'Low', exact: true });
    await lowOption.waitFor({ state: 'visible', timeout: 10_000 });
    await lowOption.click();
    await expect(combobox).toContainText('Low', { timeout: 8_000 });

    // Restore fixture to a neutral value (Medium)
    await combobox.click();
    const mediumOption = page.getByRole('option', { name: 'Medium', exact: true });
    await mediumOption.waitFor({ state: 'visible', timeout: 10_000 });
    await mediumOption.click();
    await expect(combobox).toContainText('Medium', { timeout: 8_000 });
  });

});
