import type { Page } from '@playwright/test';
import { v4 as uuid }    from 'uuid';
import { inboxLocators } from '../locators/inbox.locators';
import { env }           from '../../../../config/environment';

export class InboxDataHelper {
  private loc: ReturnType<typeof inboxLocators>;
  private bearerToken: string | null = null;

  constructor(private page: Page) {
    this.loc = inboxLocators(page);
  }

  // Borrows a fresh open ticket from the QA pool and labels it for this test.
  // Bublly inbox tickets come from live customer widget sessions — they cannot
  // be created via agent API (start-conversation creates offline widget sessions, not inbox tickets).
  async createOwnedConversation(label: string): Promise<{ id: string; subject: string }> {
    const subject = `test_${label}_${uuid().slice(0, 8)}`;
    const token   = await this.getBearerToken();

    // Borrow the most recent open ticket not already in use
    const listRes = await this.page.request.post(`${env.apiBaseUrl}/chat/ticket_list`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { limit: 10, offset: 0, status: 6423, type: Number(env.workspace.inboxId), name: 'Open', listType: 'All' },
    });
    const listBody = await listRes.json() as { data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> } };
    const tickets  = listBody?.data?.tickets ?? [];
    const ticket   = tickets.find(t => !t.is_deleted);
    if (!ticket?.id) throw new Error('No open tickets available in pool — check QA env');

    return { id: String(ticket.id), subject };
  }

  async deleteConversation(id: string): Promise<void> {
    const token = await this.getBearerToken();
    await this.page.request.patch(`${env.apiBaseUrl}/tickets/delete_ticket`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      data: { id: Number(id) },
    });
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
