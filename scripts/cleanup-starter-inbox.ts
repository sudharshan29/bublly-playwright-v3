/**
 * cleanup-starter-inbox.ts
 * Deletes all Open tickets (status=8354) in the starter inbox.
 * Run this when the inbox has accumulated too many tickets from repeated test runs.
 *
 * Usage: npx ts-node scripts/cleanup-starter-inbox.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

const API_BASE = process.env.API_BASE_URL ?? 'https://api-qa-desk.bublly.com';
const EMAIL    = process.env.STARTER_USER_EMAIL ?? '';
const PASSWORD = process.env.STARTER_USER_PASS  ?? '';

async function run() {
  console.log('\n=== Starter Inbox Cleanup ===\n');

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json() as any;
  const token = loginBody?.data?.accessToken ?? loginBody?.accessToken;
  if (!token) { console.error('Login failed'); return; }
  console.log(`Logged in as ${EMAIL}\n`);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  let totalDeleted = 0;
  let page = 0;

  while (true) {
    const listRes = await fetch(`${API_BASE}/chat/ticket_list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ limit: 100, offset: page * 100, status: 8354, type: Number(process.env.STARTER_INBOX_ID ?? '2614'), listType: 'All' }),
    });
    const listBody = await listRes.json() as any;
    const tickets: any[] = listBody?.data?.tickets ?? [];

    if (tickets.length === 0) break;

    console.log(`Found ${tickets.length} open tickets (page ${page + 1}) — deleting...`);

    for (const t of tickets) {
      const delRes = await fetch(`${API_BASE}/tickets/delete_ticket`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: t.id }),
      });
      const ok = delRes.status === 200 || delRes.status === 204;
      console.log(`  ticket ${t.id} → ${ok ? 'deleted' : `FAILED (${delRes.status})`}`);
      if (ok) totalDeleted++;
    }

    page++;
    if (tickets.length < 100) break;
  }

  console.log(`\nDone. Deleted ${totalDeleted} tickets.`);
}

run().catch(e => { console.error(e); process.exit(1); });
