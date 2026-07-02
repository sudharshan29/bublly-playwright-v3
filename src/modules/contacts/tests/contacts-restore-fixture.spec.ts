/**
 * One-shot restore: unblocks fixture contact 7575 if it is in blocked state.
 * Run this manually when the contact gets left blocked by a failed test.
 * Not part of the regular suite — excluded via @restore tag.
 */
import { test, expect } from '../fixtures/contacts.fixture';
import fixtureData        from '../../../../.fixtures/fixture-data.json';

const FIXTURE_ID = fixtureData.contacts.fixtureContactId;

test.describe('Contacts — Fixture restore @restore', () => {
  test.setTimeout(60_000);

  test('RESTORE fixture contact 7575 to unblocked state', async ({ contactsPage, page }) => {
    await contactsPage.gotoContact(FIXTURE_ID);

    // Check if already unblocked — Block div is visible means contact is NOT blocked
    const blockDiv = page.locator('div').filter({ hasText: /^Block$/ }).last();
    const alreadyUnblocked = await blockDiv.isVisible({ timeout: 5_000 }).catch(() => false);
    if (alreadyUnblocked) {
      console.log('Fixture contact is already unblocked — nothing to do.');
      expect(true).toBe(true);
      return;
    }

    // Contact is blocked — find Unblock div
    const unblockDiv = page.locator('div').filter({ hasText: /^Unblock$/ }).last();
    const canUnblock  = await unblockDiv.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!canUnblock) {
      console.log('Neither Block nor Unblock found — contact may be in unexpected state. Checking page text...');
      const body = await page.locator('body').textContent().catch(() => '');
      console.log('Page text snippet:', body?.slice(0, 500));
      test.skip(true, 'Could not find Block or Unblock action on contact page');
      return;
    }

    await unblockDiv.click();
    await page.waitForTimeout(500);

    // Unblock may show a confirmation dialog
    const unblockConfirmBtn = page.getByRole('button', { name: 'Unblock', exact: true });
    const dialogVisible = await unblockConfirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (dialogVisible) {
      await unblockConfirmBtn.click();
    }
    await page.waitForTimeout(3_000);

    // Verify restored — Block div should now be visible
    await contactsPage.gotoContact(FIXTURE_ID);
    const blockDivAfter = page.locator('div').filter({ hasText: /^Block$/ }).last();
    await expect(blockDivAfter).toBeVisible({ timeout: 10_000 });
    console.log('Fixture contact 7575 successfully unblocked.');
  });
});
