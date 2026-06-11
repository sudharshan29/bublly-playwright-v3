import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import { env } from '../config/environment';

const STALE_AGE = 24 * 60 * 60 * 1000;

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
  if (!token) throw new Error('No accessToken');
  bearerToken = `Bearer ${token}`;
  return bearerToken;
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

async function deleteTicket(id: number): Promise<void> {
  const token = await getBearerToken();
  const res = await fetch(`${env.apiBaseUrl}/tickets/delete_ticket`, {
    method:  'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id }),
  });
  if (!res.ok) console.warn(`  PATCH /tickets/delete_ticket → ${res.status} (non-fatal)`);
}

async function main() {
  console.log('[cleanup-stale] Starting...');

  const now = Date.now();
  let deleted = 0;

  let tickets: Array<{ id: number; subject?: string; created_at?: string }> = [];
  try {
    const data = await apiPost('/tickets/get_all', {
      limit: 200, offset: 0, status: 1, search: 'test_',
    }) as { data?: Array<{ id: number; subject?: string; created_at?: string }> };
    tickets = data.data ?? [];
  } catch (e) {
    console.warn('[cleanup-stale] Could not fetch tickets:', e);
  }

  for (const ticket of tickets) {
    if (!ticket.subject?.startsWith('test_')) continue;
    const age = now - (ticket.created_at ? new Date(ticket.created_at).getTime() : 0);
    if (age < STALE_AGE) continue;
    console.log(`  Deleting: ${ticket.subject} (id=${ticket.id})`);
    await deleteTicket(ticket.id);
    deleted++;
  }

  console.log(`[cleanup-stale] Done. Deleted ${deleted} stale test conversations.`);
}

main().catch(e => { console.error('[cleanup-stale] Error:', e); process.exit(1); });
