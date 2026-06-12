import type { Page }    from '@playwright/test';
import { widgetLocators } from '../locators/widget.locators';
import { env }            from '../../../../config/environment';

export class WidgetPage {
  private loc: ReturnType<typeof widgetLocators>;

  constructor(private page: Page) {
    this.loc = widgetLocators(page);
  }

  async goto(): Promise<void> {
    // Reload-retry: Help Center QA server can stall widget script injection under load
    try {
      await this.page.goto(env.helpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.page.locator('#bublly-widget').waitFor({ state: 'attached', timeout: 30_000 });
    } catch {
      await this.page.goto(env.helpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.page.locator('#bublly-widget').waitFor({ state: 'attached', timeout: 30_000 });
    }
    // Fresh browser context always shows the greeting card — wait for "Start Chat" before returning.
    // Do NOT race with launcherBtn: if launcherBtn wins, openChat() will click launcher and get
    // the wrong panel state (chat UI, not greeting card), making startChatBtn unreachable.
    await this.loc.startChatBtn.waitFor({ state: 'visible', timeout: 20_000 });
  }

  // goto() guarantees "Start Chat" is visible — click it directly to open the category panel.
  async openChat(): Promise<void> {
    await this.loc.startChatBtn.click();
  }

  async selectCategory(category: 'ask' | 'feature' | 'bug'): Promise<void> {
    const target = {
      ask:     this.loc.askQuestionOption,
      feature: this.loc.requestFeatureOption,
      bug:     this.loc.reportIssueOption,
    }[category];
    await target.waitFor({ state: 'visible', timeout: 15_000 });
    await target.click();
  }

  // Types text into the chat input and submits with Enter. Does NOT click a send button
  // because the send icon has no accessible name and Enter is the reliable submit path.
  async sendMessage(text: string): Promise<void> {
    await this.loc.chatInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.loc.chatInput.fill(text);
    await this.loc.chatInput.press('Enter');
    await this.page.waitForTimeout(1_500);
  }
}
