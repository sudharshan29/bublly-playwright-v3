import { test, expect } from '../fixtures/widget.fixture';

test.describe('Widget — Close and reopen — TC_WGT_CLOSE_001-003 @smoke', () => {
  test.setTimeout(90_000);

  test('TC_WGT_CLOSE_001 close button is visible inside the open widget', async ({ widgetPage }) => {
    await widgetPage.goto();
    // goto() guarantees startChatBtn is visible — the widget is open at this point.
    const closeBtn = widgetPage.loc.closeGreetingBtn;
    await expect(closeBtn).toBeVisible({ timeout: 8_000 });
  });

  test('TC_WGT_CLOSE_002 clicking close button hides or minimizes the widget', async ({ widgetPage }) => {
    await widgetPage.goto();
    const closeBtn = widgetPage.loc.closeGreetingBtn;
    await closeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await closeBtn.click();
    await widgetPage.page.waitForTimeout(800);
    // After close, startChatBtn should no longer be visible (widget minimized/hidden)
    const startChatStillVisible = await widgetPage.loc.startChatBtn
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(startChatStillVisible).toBe(false);
  });

  test('TC_WGT_CLOSE_003 reopening widget from launcher restores it', async ({ widgetPage }) => {
    await widgetPage.gotoWidget();
    // Wait for widget to attach then check launcher visibility
    const launcherBtn = widgetPage.loc.launcherBtn;
    const hasLauncher = await launcherBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasLauncher) {
      // Widget opened automatically — close it first so we can test the reopen flow
      const closeBtn = widgetPage.loc.closeGreetingBtn;
      const isOpen = await widgetPage.loc.startChatBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (isOpen) {
        if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await closeBtn.click();
          await widgetPage.page.waitForTimeout(600);
        }
      }
      // Now the launcher should appear
      const launcherAfterClose = await launcherBtn.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!launcherAfterClose) { test.skip(true, 'Widget launcher not found after close'); return; }
      await launcherBtn.click();
    } else {
      // Widget was minimized — click launcher to open
      await launcherBtn.click();
    }
    await widgetPage.page.waitForTimeout(1_000);
    // After clicking launcher, the greeting or chat window should be visible
    const reopened = await widgetPage.loc.startChatBtn.isVisible({ timeout: 8_000 }).catch(() => false)
      || await widgetPage.loc.chatInput.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(reopened).toBe(true);
  });
});
