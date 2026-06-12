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

    // Snapshot existing open ticket IDs BEFORE sending, so we can diff after.
    // This is more reliable than matching by message_text (which the AI may update).
    const token      = await this.getBearerToken();
    const beforeRes  = await this.page.request.post(`${env.apiBaseUrl}/chat/ticket_list`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { limit: 100, offset: 0, status: 6423, type: Number(env.workspace.inboxId), name: 'Open', listType: 'All' },
    });
    const beforeBody = await beforeRes.json() as { data?: { tickets?: Array<{ id: number }> } };
    const existingIds = new Set((beforeBody?.data?.tickets ?? []).map(t => t.id));

    const browser = await chromium.launch();
    try {
      await this.sendWidgetMessage(browser, label, message);
    } finally {
      await browser.close();
    }

    // Poll for the new ticket — QA server ingestion can take 5-45s under concurrent widget load.
    // Poll every 2s for up to 120s before giving up.
    let newTicket: { id: number; is_deleted?: boolean } | undefined;
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await this.page.waitForTimeout(2_000);
      const afterRes  = await this.page.request.post(`${env.apiBaseUrl}/chat/ticket_list`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        data: { limit: 100, offset: 0, status: 6423, type: Number(env.workspace.inboxId), name: 'Open', listType: 'All' },
      });
      const afterBody = await afterRes.json() as {
        data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> };
      };
      const allTickets = afterBody?.data?.tickets ?? [];
      newTicket = allTickets.find(t => !t.is_deleted && !existingIds.has(t.id));
      if (newTicket?.id) break;
    }

    if (!newTicket?.id) throw new Error(`Widget message sent but new ticket not found in Open inbox after 120s.`);
    return { id: String(newTicket.id), subject };
  }

  async deleteConversation(id: string): Promise<void> {
    const token = await this.getBearerToken();
    await this.page.request.patch(`${env.apiBaseUrl}/tickets/delete_ticket`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { id: Number(id) },
    });
  }

  // Simulates a customer sending a message through the Help Center widget.
  // The widget loads inside a cross-origin iframe (#bublly-widget) — all interactions
  // must be scoped through page.frameLocator() or they silently miss the target.
  private async sendWidgetMessage(browser: Browser, label: string, message: string): Promise<void> {
    const ctx  = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    try {
      // Use 'load' (not 'domcontentloaded') so all scripts run before we touch the widget.
      // The Help Center is a static page, so 'load' is reliable here.
      await page.goto(env.helpCenterUrl, { waitUntil: 'load', timeout: 45_000 });

      // Wait for the widget script to inject the iframe into the DOM.
      await page.locator('#bublly-widget').waitFor({ state: 'attached', timeout: 20_000 });

      // All widget elements live inside the cross-origin iframe
      const widget      = page.frameLocator('#bublly-widget');
      const askQuestion = widget.getByText(/ask a question/i).first();
      const startBtn    = widget.getByRole('button', { name: /start chat/i });

      // The widget cold-loads in a fresh headless browser and takes 30+ seconds
      // to boot (JS download + QA API config fetch + React render).
      // Race the two possible ready states — whichever appears first wins:
      //  • "Ask a question" — widget auto-opened to category screen
      //  • "Start Chat"     — widget showing greeting card
      await Promise.race([
        askQuestion.waitFor({ state: 'visible', timeout: 60_000 }),
        startBtn.waitFor({ state: 'visible', timeout: 60_000 }),
      ]);

      // Handle whichever state landed
      const onCategories = await askQuestion.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!onCategories) {
        // "Start Chat" appeared — click it to navigate to the category screen
        await startBtn.click();
        await askQuestion.waitFor({ state: 'visible', timeout: 15_000 });
      }
      await askQuestion.click();

      // Confirmed via DOM inspection: the chat input is a contenteditable Slate.js div with
      // aria-label="Message input". It starts as contenteditable="false" while the bot greeting
      // loads, then transitions to "true". Poll until editable before filling.
      const chatInput = widget.getByRole('textbox', { name: 'Message input' });
      const sendBtn   = widget.getByRole('button', { name: 'Send message' });

      // Helper: wait for the input to become editable (contenteditable="true")
      const waitEditable = async () => {
        await chatInput.waitFor({ state: 'visible', timeout: 30_000 });
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline) {
          if (await chatInput.getAttribute('contenteditable') === 'true') return;
          await page.waitForTimeout(800);
        }
      };

      // Step 1: send the label/question message — bot responds, asks for email
      await waitEditable();
      await chatInput.fill(message);
      await sendBtn.click();

      // Step 2: send a unique visitor email — identifies the visitor to the bot
      const visitorEmail = `visitor${Date.now()}@mailinator.com`;
      await waitEditable();
      await chatInput.fill(visitorEmail);
      await sendBtn.click();

      // Step 3: send a follow-up message — this confirms routing to human agent
      // and causes the conversation to appear in the Open inbox (status 6423).
      // Seed tickets all use "yes" as the confirming message.
      await waitEditable();
      await chatInput.fill('yes');
      await sendBtn.click();

      // Wait for the API to ingest, route, and index the ticket in the Open inbox
      await page.waitForTimeout(4_000);
    } finally {
      await ctx.close();
    }
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
