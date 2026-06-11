import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import * as fs   from 'fs';
import { env }   from '../config/environment';

const FIXTURES_FILE  = '.fixtures/fixture-data.json';

const STATUS_MAP: Record<string, number> = {
  open:     1,
  closed:   3,
  archived: 4,
  snoozed:  5,
};

const FIXTURE_CONTACT = {
  email: 'qa.fixture.contact@mailinator.com',
  name:  'QA Fixture',
};

const NUMERIC_PROJECT_ID = 672;

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
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function setConversationStatus(convId: string, status: keyof typeof STATUS_MAP): Promise<void> {
  await apiPost('/tickets/updateDetails', {
    ticket_id: Number(convId),
    status:    STATUS_MAP[status],
  });
}

async function getOrCreateFixtureContact(): Promise<number> {
  const searchRes = await apiPost('/customer/get-customer', {
    search:   FIXTURE_CONTACT.email,
    viewType: '',
    limit:    1,
    offset:   0,
  }) as { data?: { data?: Array<{ id: number }> } };

  const existing = searchRes?.data?.data?.[0];
  if (existing?.id) {
    console.log(`  Fixture contact already exists: id=${existing.id}`);
    return existing.id;
  }

  const createRes = await apiPost('/customer/create-customer', {
    email:      FIXTURE_CONTACT.email,
    full_name:  FIXTURE_CONTACT.name,
    project_id: NUMERIC_PROJECT_ID,
  }) as { data?: { id: number } };

  const newId = createRes?.data?.id;
  if (!newId) throw new Error('create-customer returned no id');
  console.log(`  Fixture contact created: id=${newId}`);
  return newId;
}

// Bublly's /customer/start-conversation creates widget/email messages and does NOT produce
// agent-inbox tickets. The ticket pool is pre-populated by real customer conversations.
// This function borrows an existing open ticket from the pool (same pattern as v2 helper).
async function borrowOpenTicket(excludeIds: Set<string>): Promise<string> {
  const listRes = await apiPost('/chat/ticket_list', {
    limit:    50,
    offset:   0,
    status:   6423,
    type:     Number(env.workspace.inboxId),
    name:     'Open',
    listType: 'All',
    groupId:  0,
  }) as { data?: { tickets?: Array<{ id: number; is_deleted?: boolean }> } };

  const tickets = listRes?.data?.tickets ?? [];
  const available = tickets.find(t => !t.is_deleted && !excludeIds.has(String(t.id)));
  if (!available?.id) throw new Error('No available open ticket in pool to borrow');
  return String(available.id);
}

async function main() {
  console.log('[seed-fixtures] Starting...');
  fs.mkdirSync('.fixtures', { recursive: true });

  console.log('\n[seed-fixtures] Checking fixture contact...');
  const customerId = await withApiSafety('getOrCreateContact', () =>
    getOrCreateFixtureContact()
  ) as number | null;

  if (!customerId) {
    console.error('[seed-fixtures] Could not get/create fixture contact — aborting');
    process.exit(1);
  }

  let fixtures: Record<string, unknown> = {};
  if (fs.existsSync(FIXTURES_FILE)) {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_FILE, 'utf-8'));
    console.log('\n[seed-fixtures] Existing fixture-data.json found. Checking conversations...');
  }

  const conversations = (fixtures['conversations'] ?? {}) as Record<string, string>;

  const needed: Array<{ key: string; status?: keyof typeof STATUS_MAP }> = [
    { key: 'open'                          },
    { key: 'snoozed',  status: 'snoozed'  },
    { key: 'closed',   status: 'closed'   },
    { key: 'archived', status: 'archived' },
    { key: 'assigned'                      },
  ];

  // Track borrowed IDs to avoid reusing the same ticket
  const borrowedIds = new Set<string>(Object.values(conversations));

  for (const item of needed) {
    if (conversations[item.key]) {
      console.log(`  [${item.key}] already seeded (${conversations[item.key]}) — skipping`);
      continue;
    }

    console.log(`\n[seed-fixtures] Borrowing ticket for ${item.key}...`);

    // If the target status is not open, first borrow an open ticket then move it
    // For open/assigned we leave it open; for others we change the status
    const convId = await withApiSafety(`borrow:${item.key}`, () =>
      borrowOpenTicket(borrowedIds)
    );

    if (!convId) continue;
    borrowedIds.add(convId);

    if (item.status) {
      await withApiSafety(`setStatus:${item.key}`, () =>
        setConversationStatus(convId, item.status!)
      );
      console.log(`  Status set to ${item.status} (${STATUS_MAP[item.status]})`);
    }

    conversations[item.key] = convId;
  }

  const fixtureData = {
    contact:       FIXTURE_CONTACT,
    conversations,
  };

  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(fixtureData, null, 2));
  console.log(`\n[seed-fixtures] Done. Written to ${FIXTURES_FILE}`);
  console.log(JSON.stringify(fixtureData, null, 2));
}

main().catch((e) => {
  console.error('[seed-fixtures] Fatal error:', e);
  process.exit(1);
});
