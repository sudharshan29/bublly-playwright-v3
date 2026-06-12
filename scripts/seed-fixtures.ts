import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import * as fs                  from 'fs';
import { chromium }             from '@playwright/test';
import { env }                  from '../config/environment';
import { v4 as uuid }           from 'uuid';

const FIXTURES_FILE = '.fixtures/fixture-data.json';

const STATUS_MAP: Record<string, number> = {
  open:     1,
  closed:   3,
  archived: 4,
  snoozed:  5,
};

let bearerToken: string | null = null;

async function getBearerToken(): Promise<string> {
  if (bearerToken) return bearerToken;
  const res = await fetch(`${env.apiBaseUrl}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: env.freeUser.email, password: env.freeUser.password }),
  });
  if (!res.ok) throw new Error(`Auth login → ${res.status}`);
  const body = await res.json() as { data?: { accessToken: string }; accessToken?: string };
  const token = body?.data?.accessToken ?? body?.accessToken;
  if (!token) throw new Error('No accessToken in auth response');
  bearerToken = `Bearer ${token}`;
  return bearerToken;
}

async function withApiSafety<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.warn(`[seed-fixtures] ${label} failed — skipping. ${e}`);
    return null;
  }
}

async function apiPost(path: string, body: object): Promise<unknown> {
  const token = await getBearerToken();
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method:  'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function setConversationStatus(convId: string, status: keyof typeof STATUS_MAP): Promise<void> {
  await apiPost('/tickets/updateDetails', {
    ticket_id: Number(convId),
    status:    STATUS_MAP[status],
  });
}

// Creates a real inbox ticket by simulating a customer starting a chat through
// the Help Center widget at helpCenterUrl. This is the correct flow confirmed by
// the user: customer opens widget → picks option → sends message → ticket appears in agent inbox.
async function createTicketViaWidget(label: string, message: string): Promise<string> {
  const browser = await chromium.launch();
  // QA Help Center uses a self-signed cert ("Not Secure" in browser) — must ignore TLS errors
  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  try {
    console.log(`  Opening Help Center widget at ${env.helpCenterUrl}...`);
    await page.goto(env.helpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Widget opens automatically or via "Start Chat" button
    const startChatBtn = page.getByRole('button', { name: /start chat/i });
    if (await startChatBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startChatBtn.click();
    }

    // Wait for the 3-option panel: Ask a question / Request a Feature / Report an Issue
    await page.getByText(/ask a question/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByText(/ask a question/i).click();

    // Fill in name/email if the widget asks for it (some widget configs require it)
    const nameField = page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i));
    if (await nameField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameField.fill(`QA Seed ${label}`);
    }
    const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
    if (await emailField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await emailField.fill(`qa.seed.${label}.${uuid().slice(0, 6)}@mailinator.com`);
    }

    // Type the message in the chat input
    const messageInput = page.getByRole('textbox').last();
    await messageInput.waitFor({ state: 'visible', timeout: 10_000 });
    await messageInput.fill(message);

    // Send the message
    const sendBtn = page.getByRole('button', { name: /send/i })
      .or(page.locator('button[type="submit"]'))
      .last();
    await sendBtn.click();

    // Wait for confirmation that the message was sent
    await page.waitForTimeout(2_000);
    console.log(`  Message sent via widget.`);

  } finally {
    await browser.close();
  }

  // Query ticket_list to find the newly created ticket — wait a moment for indexing
  await new Promise(r => setTimeout(r, 2_000));
  const listRes = await apiPost('/chat/ticket_list', {
    limit:    10,
    offset:   0,
    status:   6423,
    type:     Number(env.workspace.inboxId),
    name:     'Open',
    listType: 'All',
  }) as { data?: { tickets?: Array<{ id: number; message_text?: string; is_deleted?: boolean }> } };

  const tickets = listRes?.data?.tickets ?? [];
  // Match by first 20 chars of message or fall back to most recent
  const match = tickets.find(t =>
    !t.is_deleted && t.message_text && message.startsWith(t.message_text.substring(0, 20))
  ) ?? tickets.find(t => !t.is_deleted);

  if (!match?.id) throw new Error(`Widget message sent but ticket not found in ticket_list`);
  console.log(`  Created ticket via widget: id=${match.id}`);
  return String(match.id);
}

async function main() {
  console.log('[seed-fixtures] Starting...');
  console.log(`[seed-fixtures] Help Center URL: ${env.helpCenterUrl}`);
  fs.mkdirSync('.fixtures', { recursive: true });

  let fixtures: Record<string, unknown> = {};
  if (fs.existsSync(FIXTURES_FILE)) {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_FILE, 'utf-8'));
    console.log('[seed-fixtures] Existing fixture-data.json found — checking...');
  }

  const conversations = (fixtures['conversations'] ?? {}) as Record<string, string>;

  const needed: Array<{ key: string; label: string; status?: keyof typeof STATUS_MAP }> = [
    { key: 'open',     label: 'open'     },
    { key: 'snoozed',  label: 'snoozed',  status: 'snoozed'  },
    { key: 'closed',   label: 'closed',   status: 'closed'   },
    { key: 'archived', label: 'archived', status: 'archived' },
    { key: 'assigned', label: 'assigned' },
  ];

  for (const item of needed) {
    if (conversations[item.key]) {
      console.log(`  [${item.key}] already seeded (${conversations[item.key]}) — skipping`);
      continue;
    }

    console.log(`\n[seed-fixtures] Creating [${item.key}] ticket via Help Center widget...`);
    const message = `qa_seed_${item.label}_${uuid().slice(0, 8)}`;

    const convId = await withApiSafety(`create:${item.key}`, () =>
      createTicketViaWidget(item.label, message)
    );

    if (!convId) {
      console.warn(`  [${item.key}] widget approach failed — falling back to pool borrow`);
      // Fallback: borrow from pool if widget fails (e.g. widget UI changed)
      const fallbackRes = await apiPost('/chat/ticket_list', {
        limit: 50, offset: 0, status: 6423,
        type: Number(env.workspace.inboxId), name: 'Open', listType: 'All',
      }) as { data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> } };
      const used    = new Set(Object.values(conversations));
      const tickets = fallbackRes?.data?.tickets ?? [];
      const ticket  = tickets.find(t => !t.is_deleted && !used.has(String(t.id)));
      if (!ticket?.id) { console.warn(`  No fallback ticket available either — skipping`); continue; }
      conversations[item.key] = String(ticket.id);
      console.log(`  [${item.key}] fallback → ticket ${ticket.id}`);
    } else {
      if (item.status) {
        await withApiSafety(`setStatus:${item.key}`, () =>
          setConversationStatus(convId, item.status!)
        );
        console.log(`  Status set → ${item.status} (code ${STATUS_MAP[item.status]})`);
      }
      conversations[item.key] = convId;
    }
  }

  const fixtureData = { conversations };
  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(fixtureData, null, 2));
  console.log(`\n[seed-fixtures] Done. Written to ${FIXTURES_FILE}`);
  console.log(JSON.stringify(fixtureData, null, 2));
}

main().catch(e => {
  console.error('[seed-fixtures] Fatal:', e);
  process.exit(1);
});
