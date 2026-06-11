import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import * as fs from 'fs';
import { env } from '../config/environment';

const FIXTURES_FILE      = '.fixtures/fixture-data.json';
const NUMERIC_PROJECT_ID = 672;

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

// Bublly inbox tickets come from live customer chat sessions — they cannot be created via agent API.
// Instead we borrow existing open tickets from the pool (QA env has 800+ tickets).
// Smoke tests are read-only and do not mutate these tickets.
async function borrowOpenTicket(excludeIds: Set<string>): Promise<string> {
  // ticket_list response shape: { data: { tickets: [...], status: ... } }
  const listRes = await apiPost('/chat/ticket_list', {
    limit:    50,
    offset:   0,
    status:   6423,
    type:     Number(env.workspace.inboxId),
    name:     'Open',
    listType: 'All',
  }) as { data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> } };

  const tickets = listRes?.data?.tickets ?? [];
  const available = tickets.find(t => !t.is_deleted && !excludeIds.has(String(t.id)));
  if (!available?.id) throw new Error('No available open ticket in pool');
  return String(available.id);
}

async function main() {
  console.log('[seed-fixtures] Starting...');
  fs.mkdirSync('.fixtures', { recursive: true });

  let fixtures: Record<string, unknown> = {};
  if (fs.existsSync(FIXTURES_FILE)) {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_FILE, 'utf-8'));
    console.log('[seed-fixtures] Existing fixture-data.json found — checking...');
  }

  const conversations = (fixtures['conversations'] ?? {}) as Record<string, string>;
  const usedIds       = new Set<string>(Object.values(conversations));

  const needed: Array<{ key: string; status?: keyof typeof STATUS_MAP }> = [
    { key: 'open'                         },
    { key: 'snoozed',  status: 'snoozed' },
    { key: 'closed',   status: 'closed'  },
    { key: 'archived', status: 'archived'},
    { key: 'assigned'                     },
  ];

  for (const item of needed) {
    if (conversations[item.key]) {
      console.log(`  [${item.key}] already seeded (${conversations[item.key]}) — skipping`);
      continue;
    }

    console.log(`\n[seed-fixtures] Borrowing ticket for [${item.key}]...`);
    const convId = await withApiSafety(`borrow:${item.key}`, () => borrowOpenTicket(usedIds));
    if (!convId) continue;
    usedIds.add(convId);

    if (item.status) {
      await withApiSafety(`setStatus:${item.key}`, () =>
        setConversationStatus(convId, item.status!)
      );
      console.log(`  Status set → ${item.status} (code ${STATUS_MAP[item.status]})`);
    }

    conversations[item.key] = convId;
    console.log(`  [${item.key}] → ticket ${convId}`);
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
