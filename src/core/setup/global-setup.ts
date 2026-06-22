import * as fs from 'fs';
import { chromium, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });
import { env } from '../../../config/environment';

const AUTH_FILE = '.auth/free-user.json';
// Force re-login if the auth file is older than 20 minutes — ensures each run
// starts with a fresh token that will outlast the longest expected suite run.
const MAX_TOKEN_AGE_MS = 20 * 60 * 1000;

export default async function globalSetup() {
  if (fs.existsSync(AUTH_FILE)) {
    const ageMs = Date.now() - fs.statSync(AUTH_FILE).mtimeMs;
    if (ageMs < MAX_TOKEN_AGE_MS) {
      const valid = await validateTokenFromFile(AUTH_FILE);
      if (valid) {
        console.log(`[global-setup] auth token fresh (${Math.round(ageMs / 1000)}s old) — skipping re-login`);
        await warmupWidgetServer();
        return;
      }
    }
    console.log('[global-setup] auth token stale or expired — re-logging in');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await doLogin(page);
  await page.waitForURL('**/dashboard', { timeout: 60_000, waitUntil: 'commit' });

  const state = await page.context().storageState();
  const ssData = await page.evaluate(
    () => Object.fromEntries(Object.entries(sessionStorage))
  );

  fs.mkdirSync('.auth', { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ ...state, sessionStorageData: ssData }, null, 2));
  console.log(`[global-setup] auth file written to ${AUTH_FILE}`);

  await browser.close();

  await warmupWidgetServer();
}

// ── Widget server warmup ───────────────────────────────────────────────────────
// The help-center widget server sleeps when idle and takes 60-180s to cold-start.
// Poll every 10s for up to 3 minutes so widget tests don't fail on cold-start.
async function warmupWidgetServer(): Promise<void> {
  const widgetUrl = env.helpCenterUrl ?? '';
  if (!widgetUrl) return;
  const deadline = Date.now() + 180_000;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    try {
      const res = await fetch(widgetUrl, { method: 'GET', signal: AbortSignal.timeout(20_000) });
      console.log(`[global-setup] widget server warmed up (attempt ${attempt}) — HTTP ${res.status}`);
      return;
    } catch {
      console.log(`[global-setup] widget server not ready yet (attempt ${attempt}) — retrying in 10s`);
      await new Promise(r => setTimeout(r, 10_000));
    }
  }
  console.log('[global-setup] widget server warmup timed out after 3 min — widget tests may be slow');
}

// ── Two-step login ─────────────────────────────────────────────────────────────
async function doLogin(page: Page): Promise<void> {
  await page.goto(`${env.baseUrl}/login`);

  // Step 1: enter email
  await page.getByRole('textbox', { name: 'Work Email*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Step 2: enter password
  await page.waitForURL(/login/, { timeout: 30_000, waitUntil: 'commit' });
  await page.getByRole('textbox', { name: 'Password*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Password*' }).fill(env.freeUser.password);
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
