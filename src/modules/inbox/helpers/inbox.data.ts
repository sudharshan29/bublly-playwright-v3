import type { Browser, Page } from '@playwright/test';
import { chromium }           from '@playwright/test';
import { v4 as uuid }         from 'uuid';
import { inboxLocators }      from '../locators/inbox.locators';
import { env }                from '../../../../config/environment';

export class InboxDataHelper {
  private loc: ReturnType<typeof inboxLocators>;
  private bearerToken: string | null = null;

  constructor(private page: Page) {
    this.loc = inboxLocators(page);
  }

  // Creates a real inbox ticket by simulating a customer using the Help Center widget.
  // Confirmed correct approach: customer opens widget → picks "Ask a question" → sends message
  // → ticket appears in agent inbox. Returns the ticket id and a subject label.
  async createOwnedConversation(label: string): Promise<{ id: string; subject: string }> {
    const subject = `test_${label}_${uuid().slice(0, 8)}`;
    const message = subject;

    const browser = await chromium.launch();
    try {
      await this.sendWidgetMessage(browser, label, message);
    } finally {
      await browser.close();
    }

    // Brief wait for ticket to appear in inbox
    await this.page.waitForTimeout(2_000);

    const token   = await this.getBearerToken();
    const listRes = await this.page.request.post(`${env.apiBaseUrl}/chat/ticket_list`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: {
        limit: 10, offset: 0, status: 6423,
        type: Number(env.workspace.inboxId), name: 'Open', listType: 'All',
      },
    });
    const listBody = await listRes.json() as {
      data?: { tickets?: Array<{ id: number; message_text?: string; is_deleted?: boolean }> };
    };
    const tickets = listBody?.data?.tickets ?? [];
    const match   = tickets.find(t =>
      !t.is_deleted && t.message_text && message.startsWith(t.message_text.substring(0, 20))
    ) ?? tickets.find(t => !t.is_deleted);

    if (!match?.id) throw new Error(`Widget message sent but ticket not found. Run npm run seed first.`);
    return { id: String(match.id), subject };
  }

  async deleteConversation(id: string): Promise<void> {
    const token = await this.getBearerToken();
    await this.page.request.patch(`${env.apiBaseUrl}/tickets/delete_ticket`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { id: Number(id) },
    });
  }

  // Simulates a customer sending a message through the Help Center widget.
  // Opens a fresh browser context (no agent auth) to the help center URL.
  private async sendWidgetMessage(browser: Browser, label: string, message: string): Promise<void> {
    const page = await browser.newPage();
    await page.goto(env.helpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Widget may auto-open or require clicking "Start Chat"
    const startBtn = page.getByRole('button', { name: /start chat/i });
    if (await startBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startBtn.click();
    }

    // Pick "Ask a question" from the 3-option panel
    await page.getByText(/ask a question/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByText(/ask a question/i).click();

    // Fill optional name/email fields if shown
    const nameField = page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i));
    if (await nameField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameField.fill(`QA Test ${label}`);
    }
    const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
    if (await emailField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await emailField.fill(`qa.test.${label}.${uuid().slice(0, 6)}@mailinator.com`);
    }

    // Type message and send
    const messageInput = page.getByRole('textbox').last();
    await messageInput.waitFor({ state: 'visible', timeout: 10_000 });
    await messageInput.fill(message);

    const sendBtn = page.getByRole('button', { name: /send/i })
      .or(page.locator('button[type="submit"]'))
      .last();
    await sendBtn.click();
    await page.waitForTimeout(1_500);
  }

  private async getBearerToken(): Promise<string> {
    if (this.bearerToken) return this.bearerToken;
    const res = await this.page.request.post(`${env.apiBaseUrl}/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: env.freeUser.email, password: env.freeUser.password },
    });
    const body = await res.json() as { data?: { accessToken: string }; accessToken?: string };
    const token = body?.data?.accessToken ?? body?.accessToken;
    if (!token) throw new Error('Failed to get Bearer token');
    this.bearerToken = `Bearer ${token}`;
    return this.bearerToken;
  }
}
