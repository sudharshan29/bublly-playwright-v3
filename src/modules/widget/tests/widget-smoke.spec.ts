import { test, expect } from '../fixtures/widget.fixture';

test.describe('Widget smoke — TC_WGT_001-005 @smoke', () => {
  test.setTimeout(60_000);

  test('TC_WGT_001 Help Center page loads and widget iframe is attached', async ({ page, widgetPage }) => {
    await widgetPage.goto();
    await expect(page.locator('#bublly-widget')).toBeAttached({ timeout: 15_000 });
    await expect(page).toHaveTitle(/Help Center/i);
  });

  test('TC_WGT_002 Start Chat button is visible in widget greeting card', async ({ page, widgetPage }) => {
    await widgetPage.goto();
    const frame = page.frameLocator('#bublly-widget');
    await expect(frame.getByRole('button', { name: /start chat/i })).toBeVisible({ timeout: 20_000 });
  });

  test('TC_WGT_003 Start Chat reveals three conversation category options', async ({ page, widgetPage }) => {
    await widgetPage.goto();
    await widgetPage.openChat();
    const frame = page.frameLocator('#bublly-widget');
    await expect(frame.getByText(/ask a question/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(frame.getByText(/request a feature/i).first()).toBeVisible();
    await expect(frame.getByText(/report an issue or bug/i).first()).toBeVisible();
  });

  test('TC_WGT_004 Ask a question opens chat interface with bot greeting', async ({ page, widgetPage }) => {
    await widgetPage.goto();
    await widgetPage.openChat();
    await widgetPage.selectCategory('ask');
    const frame = page.frameLocator('#bublly-widget');
    await expect(frame.getByText(/happy to help/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC_WGT_005 chat input is visible and accepts text input', async ({ page, widgetPage }) => {
    await widgetPage.goto();
    await widgetPage.openChat();
    await widgetPage.selectCategory('ask');
    const frame     = page.frameLocator('#bublly-widget');
    // The chat input is a contenteditable div with aria-label="Message input" — no placeholder attribute.
    // getByPlaceholder() does NOT work here; target by role + name instead.
    const chatInput = frame.getByRole('textbox', { name: 'Message input' });
    await chatInput.waitFor({ state: 'visible', timeout: 15_000 });

    // Slate.js starts as contenteditable="false" while the bot greeting loads asynchronously.
    // fill() and pressSequentially() both silently no-op when contenteditable="false" —
    // the input stays empty (or shows a placeholder) and the assertion fails.
    // Poll until the editor transitions to contenteditable="true" before filling.
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (await chatInput.getAttribute('contenteditable') === 'true') break;
      await page.waitForTimeout(500);
    }

    // fill() works reliably once contenteditable="true" (same technique used in sendWidgetMessage).
    await chatInput.fill('QA smoke test input');
    // contenteditable: read back via innerText, not inputValue
    const filled = await chatInput.innerText();
    expect(filled.trim()).toContain('QA smoke test input');
  });

});
