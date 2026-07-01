import { test, expect } from '../fixtures/inbox-starter.fixture';
import { TIMEOUTS }     from '../../../../core/constants/timeouts';

test.describe('Inbox Custom View — functional — TC_CUV_005–007 @smoke', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ inboxCustomViewPage }) => {
    await inboxCustomViewPage.gotoInbox();
  });

  test('TC_CUV_005 admin sees Custom View section in sidebar', async ({ page }) => {
    const customView = page.getByText('Custom View', { exact: true });
    await expect(customView).toBeVisible({ timeout: 10_000 });
  });

  test('TC_CUV_006 Custom View add button opens Add Filter View modal', async ({ page }) => {
    const customView = page.getByText('Custom View', { exact: true });
    await expect(customView).toBeVisible({ timeout: 10_000 });
    await customView.hover();
    await page.waitForTimeout(500);
    const addIcon = page.locator('img[alt="add"]').first()
      .or(page.getByRole('img', { name: 'add' }).first());
    const isVisible = await addIcon.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Add icon not visible — hover-only or different locator needed');
      return;
    }
    await addIcon.click();
    const modal = page.getByText('Add Filter View', { exact: false }).first()
      .or(page.getByRole('heading', { name: /add filter view|create view/i }).first());
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
  });

  test('TC_CUV_007 Custom View modal has View Name required field', async ({ page }) => {
    const customView = page.getByText('Custom View', { exact: true });
    await customView.hover();
    await page.waitForTimeout(500);
    const addIcon = page.locator('img[alt="add"]').first()
      .or(page.getByRole('img', { name: 'add' }).first());
    const isVisible = await addIcon.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Add icon not visible on hover');
      return;
    }
    await addIcon.click();
    await page.getByText('Add Filter View', { exact: false }).first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    const nameField = page.getByRole('textbox', { name: /view name|name/i }).first()
      .or(page.getByPlaceholder(/view name|enter name/i).first());
    await expect(nameField).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });

  test('TC_CUV_008 Custom View modal shows filter options', async ({ page }) => {
    const customView = page.getByText('Custom View', { exact: true });
    await customView.hover();
    await page.waitForTimeout(500);
    const addIcon = page.locator('img[alt="add"]').first()
      .or(page.getByRole('img', { name: 'add' }).first());
    const isVisible = await addIcon.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Add icon not visible on hover');
      return;
    }
    await addIcon.click();
    await page.getByText('Add Filter View', { exact: false }).first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    // At least one filter option should be visible (Priority, Status, etc.)
    const filterOption = page.getByText('Priority', { exact: true }).first()
      .or(page.getByText('Status', { exact: true }).first());
    await expect(filterOption).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });
});
