import * as fs from 'fs';
import { chromium, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });
import { env } from '../../../config/environment';
import { seedStarterInbox } from '../../../scripts/seed-starter-inbox';
import { API_STATUS } from '../constants/api-constants';

const FREE_AUTH_FILE          = '.auth/free-user.json';
const STARTER_ADMIN_AUTH_FILE = '.auth/starter-admin.json';
const STARTER_AGENT_AUTH_FILE = '.auth/starter-agent.json';
const MAX_TOKEN_AGE_MS = 20 * 60 * 1000;
const MIN_OPEN_TICKETS = 5; // skip seeding if inbox already has this many open tickets

export default async function globalSetup() {
  await ensureAuth(FREE_AUTH_FILE,          env.freeUser.email,     env.freeUser.password,     'free');
  await ensureAuth(STARTER_ADMIN_AUTH_FILE, env.starterUser.email,  env.starterUser.password,  'starter-admin');
  await ensureAuth(STARTER_AGENT_AUTH_FILE, env.starterAgent.email, env.starterAgent.password, 'starter-agent');
  await conditionalSeed();
}

async function conditionalSeed(): Promise<void> {
  try {
    // Login as starter admin to check current open ticket count
    const loginRes = await fetch(`${env.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.starterUser.email, password: env.starterUser.password }),
      signal: AbortSignal.timeout(15_000),
    });
    const loginBody = await loginRes.json() as { data?: { accessToken: string }; accessToken?: string };
    const token = loginBody?.data?.accessToken ?? loginBody?.accessToken;
    if (!token) throw new Error('Could not get starter token for seed check');

    const listRes = await fetch(`${env.apiBaseUrl}/chat/ticket_list`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 20, offset: 0, status: API_STATUS.STARTER_INBOX_OPEN, type: Number(env.starter.inboxId), listType: 'All' }),
      signal: AbortSignal.timeout(15_000),
    });
    const listBody = await listRes.json() as { data?: { tickets?: unknown[] } };
    const openCount = (listBody?.data?.tickets ?? []).length;

    if (openCount >= MIN_OPEN_TICKETS) {
      console.log(`[global-setup] Starter inbox already has ${openCount} open tickets — skipping seed`);
      return;
    }

    console.log(`[global-setup] Starter inbox has ${openCount} open tickets (need ${MIN_OPEN_TICKETS}) — seeding`);
    await seedStarterInbox();
  } catch (err) {
    console.warn(`[global-setup] Seed check failed (${err}) — running seed anyway`);
    await seedStarterInbox();
  }
}

async function ensureAuth(
  authFile: string,
  email: string,
  password: string,
  label: string,
): Promise<void> {
  if (!email) {
    console.log(`[global-setup] ${label} credentials not set — skipping`);
    return;
  }

  if (fs.existsSync(authFile)) {
    const ageMs = Date.now() - fs.statSync(authFile).mtimeMs;
    if (ageMs < MAX_TOKEN_AGE_MS) {
      const valid = await validateTokenFromFile(authFile);
      if (valid) {
        console.log(`[global-setup] ${label} auth token fresh (${Math.round(ageMs / 1000)}s old) — skipping re-login`);
        return;
      }
    }
    console.log(`[global-setup] ${label} auth token stale or expired — re-logging in`);
  }

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await doLogin(page, email, password);
  // Admins land on /dashboard; agents land on /inbox — wait for either
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60_000, waitUntil: 'commit' });

  const state  = await page.context().storageState();
  const ssData = await page.evaluate(
    () => Object.fromEntries(Object.entries(sessionStorage))
  );

  fs.mkdirSync('.auth', { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify({ ...state, sessionStorageData: ssData }, null, 2));
  console.log(`[global-setup] ${label} auth file written to ${authFile}`);

  await browser.close();
}

// ── Two-step login ─────────────────────────────────────────────────────────────
async function doLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${env.baseUrl}/login`);

  // Step 1: enter email
  await page.getByRole('textbox', { name: 'Work Email*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Work Email*' }).fill(email);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Step 2: enter password
  await page.waitForURL(/login/, { timeout: 30_000, waitUntil: 'commit' });
  await page.getByRole('textbox', { name: 'Password*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Password*' }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
}

async function validateTokenFromFile(filePath: string): Promise<boolean> {
  const auth = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const userKeyRaw = auth.sessionStorageData?.userKey;
  if (!userKeyRaw) return false;

  try {
    const { accessToken } = JSON.parse(userKeyRaw) as { accessToken?: string };
    if (!accessToken) return false;

    const res = await fetch(`${env.apiBaseUrl}/users/getUser`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
