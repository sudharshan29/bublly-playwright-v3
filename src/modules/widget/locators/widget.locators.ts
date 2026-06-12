import type { Page } from '@playwright/test';

export function widgetLocators(page: Page) {
  // The widget lives inside a cross-origin iframe on the Help Center page.
  // All locators are scoped to the frame — never use page.* for widget elements.
  const frame = page.frameLocator('#bublly-widget');

  return {
    frame,

    // Collapsed launcher (the round bubble at bottom-right when widget is closed)
    launcherBtn:          frame.getByRole('button', { name: /open chat/i }),

    // Greeting card (auto-shown on page load)
    startChatBtn:         frame.getByRole('button', { name: /start chat/i }),
    closeGreetingBtn:     frame.getByRole('button', { name: /close/i }).first(),

    // Category menu (shown after clicking Start Chat)
    askQuestionOption:    frame.getByText(/ask a question/i).first(),
    requestFeatureOption: frame.getByText(/request a feature/i).first(),
    reportIssueOption:    frame.getByText(/report an issue or bug/i).first(),

    // Chat interface (shown after selecting a category)
    // The input is a contenteditable div (aria-label="Message input") — no placeholder attribute.
    chatInput:            frame.getByRole('textbox', { name: 'Message input' }),
    sendBtn:              frame.getByRole('button', { name: 'Send message' }),
    botGreeting:          frame.getByText(/happy to help/i).first(),
    poweredByBublly:      frame.getByText(/powered by bublly/i).first(),
  };
}
