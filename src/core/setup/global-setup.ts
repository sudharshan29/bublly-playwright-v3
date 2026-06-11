import * as fs from 'fs';
import { chromium, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });
import { env } from '../../../config/environment';

const AUTH_FILE = '.auth/free-user.json';

export default async function globalSetup() {
  if (fs.existsSync(AUTH_FILE)) {
    const valid = await validateTokenFromFile(AUTH_FILE);
    if (valid) {
      console.log('[global-setup] auth token still valid — skipping re-login');
      return;
    }
    console.log('[global-setup] auth token expired — re-logging in');
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
}

// Bublly TWO-STEP login: email → Sign In → still on /login → password → Sign In → /dashboard
// The loading overlay (div.fixed.inset-0) appears between transitions and must be waited out.
async function doLogin(page: Page): Promise<void> {
  await page.goto(`${env.baseUrl}/login`);

  // Step 1: enter email
  await page.getByRole('textbox', { name: 'Work Email*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Work Email*' }).fill(env.freeUser.email);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Step 2: enter password (URL stays /login but password field appears)
  await page.waitForURL(/login/, { timeout: 30_000, waitUntil: 'commit' });
  await page.getByRole('textbox', { name: 'Password*' }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('div.fixed.inset-0').waitFor({ state: 'hidden', timeout: 30_000 });
  await page.getByRole('textbox', { name: 'Password*' }).fill(env.freeUser.password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
}

async function validateTokenFromFile(filePath: string): Promise<boolean> {
  const auth = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Bublly stores auth ENTIRELY in sessionStorage.userKey — there are NO auth cookies.
  const userKeyRaw = auth.sessionStorageData?.userKey;
  if (!userKeyRaw) return false;

  try {
    const { accessToken } = JSON.parse(userKeyRaw) as { accessToken?: string };
    if (!accessToken) return false;

    const res = await fetch(`${env.apiBaseUrl}/users/getUser`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
