import { test as base, type Page } from '@playwright/test';
import * as fs from 'fs';
import { PERSONAS } from '../../../config/personas';

type PersonaKey = keyof typeof PERSONAS;
type Fixtures   = { page: Page; persona: PersonaKey };

export const test = base.extend<Fixtures>({
  persona: ['freeUser', { option: true }],

  page: async ({ browser, persona }, use) => {
    const authFilePath = PERSONAS[persona].authFile;

    if (!fs.existsSync(authFilePath)) {
      throw new Error(
        `Auth file not found: ${authFilePath}. Run 'npx playwright test' once to generate it via globalSetup.`
      );
    }

    const authFile = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));

    const ctx = await browser.newContext({
      storageState: {
        cookies: authFile.cookies  ?? [],
        origins: authFile.origins  ?? [],
      },
    });

    const page = await ctx.newPage();

    // Inject sessionStorage before any navigation — fires on every page load in this context
    await page.addInitScript((ss: Record<string, string>) => {
      Object.entries(ss).forEach(([k, v]) => sessionStorage.setItem(k, v));
    }, authFile.sessionStorageData ?? {});

    // Mid-run login guard: if the QA server redirects to /login unexpectedly
    // (token invalidated by server restart or session expiry), re-inject the
    // latest token from the auth file so the current test can recover on retry.
    page.on('framenavigated', frame => {
      if (frame !== page.mainFrame()) return;
      const url = frame.url();
      if (url.includes('/login')) {
        const latest = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
        const ss = latest.sessionStorageData ?? {};
        page.evaluate((data: Record<string, string>) => {
          Object.entries(data).forEach(([k, v]) => sessionStorage.setItem(k, v));
        }, ss).catch(() => {});
      }
    });

    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
