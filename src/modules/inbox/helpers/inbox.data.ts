import type { Browser, Page } from '@playwright/test';
import { chromium }           from '@playwright/test';
import { v4 as uuid }         from 'uuid';
import { inboxLocators }      from '../locators/inbox.locators';
import { env }                from '../../../../config/environment';
import { API_STATUS }         from '../../../core/constants/api-constants';

export class InboxDataHelper {
  private loc: ReturnType<typeof inboxLocators>;
  private bearerToken: string | null = null;

  constructor(private page: Page) {
    this.loc = inboxLocators(page);
  }

  // Returns an existing Open ticket from the starter inbox seeded during global-setup,
  // or null if no seeded tickets are available (e.g. starter widget broken in QA env).
  // Picks the OLDEST ticket (last in newest-first API list) to avoid collision with
  // TC_ADM_INB_001-008 which consume the newest tickets first.
  async getSeededConversation(): Promise<{ id: string; ticketUrl: string } | null> {
    const token = await this.getStarterBearerToken();
    const res   = await this.page.request.post(`${env.apiBaseUrl}/chat/ticket_list`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { limit: 100, offset: 0, status: API_STATUS.STARTER_INBOX_OPEN, type: Number(env.starter.inboxId), name: 'Open', listType: 'All' },
    });
    const body    = await res.json() as { data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> } };
    const tickets = (body?.data?.tickets ?? []).filter(t => !t.is_deleted);
    if (tickets.length === 0) return null; // widget seeding failed — callers must skip
    // Pick the oldest ticket (last in the list — API returns newest first)
    const ticket    = tickets[tickets.length - 1];
    const id        = String(ticket.id);
    const ticketUrl = `${env.baseUrl}/project/${env.starter.projectId}/inbox/${env.starter.inboxId}/all/open/ticket/${id}`;
    return { id, ticketUrl };
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete from starter inbox — matches where createOwnedConversation now creates tickets
    const token = await this.getStarterBearerToken();
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
      // Use starter help center — routing pipeline verified working (10/10 seed tickets per run).
      // Free plan QA routing is misconfigured and never routes tickets to Open inbox.
      await page.goto(env.starterHelpCenterUrl, { waitUntil: 'load', timeout: 45_000 });

      // Wait for the widget script to inject the iframe into the DOM.
      await page.locator('#bublly-widget').waitFor({ state: 'attached', timeout: 20_000 });

      // All widget elements live inside the cross-origin iframe
      const widget      = page.frameLocator('#bublly-widget');
      const launcherBtn = widget.getByRole('button', { name: /open chat/i });
      const startBtn    = widget.getByRole('button', { name: /start chat/i });
      const askQuestion = widget.getByText(/ask a question/i).first();

      // Widget has three possible initial states:
      //  1. Launcher (collapsed bubble "Open Chat") — starter plan default
      //  2. Greeting card ("Start Chat") — auto-expanded
      //  3. Categories screen ("Ask a question") — already past greeting
      await Promise.race([
        launcherBtn.waitFor({ state: 'visible', timeout: 60_000 }),
        startBtn.waitFor({ state: 'visible', timeout: 60_000 }),
        askQuestion.waitFor({ state: 'visible', timeout: 60_000 }),
      ]);

      // Handle whichever state landed
      const onCategories = await askQuestion.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!onCategories) {
        const onGreeting = await startBtn.isVisible({ timeout: 2_000 }).catch(() => false);
        if (!onGreeting) {
          // Collapsed launcher — click to open greeting card
          await launcherBtn.click();
          await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
        }
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

      // Slate contenteditable divs reject fill() — click to focus then pressSequentially
      const typeIntoChat = async (text: string) => {
        await waitEditable();
        await chatInput.click();
        await chatInput.pressSequentially(text, { delay: 30 });
      };

      // Step 1: send the label/question message — bot responds, asks for email
      await typeIntoChat(message);
      await sendBtn.click();

      // Step 2: send a unique visitor email — identifies the visitor to the bot
      const visitorEmail = `visitor${Date.now()}@mailinator.com`;
      await typeIntoChat(visitorEmail);
      await sendBtn.click();

      // Step 3: send a follow-up message — this confirms routing to human agent
      // and causes the conversation to appear in the Open inbox (status 8354 = starter inbox Open).
      // Seed tickets all use "yes" as the confirming message.
      await typeIntoChat('yes');
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

  private starterBearerToken: string | null = null;

  private async getStarterBearerToken(): Promise<string> {
    if (this.starterBearerToken) return this.starterBearerToken;
    const res = await this.page.request.post(`${env.apiBaseUrl}/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: env.starterUser.email, password: env.starterUser.password },
    });
    const body = await res.json() as { data?: { accessToken: string }; accessToken?: string };
    const token = body?.data?.accessToken ?? body?.accessToken;
    if (!token) throw new Error('Failed to get starter Bearer token');
    this.starterBearerToken = `Bearer ${token}`;
    return this.starterBearerToken;
  }
}
