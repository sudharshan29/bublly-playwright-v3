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

    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
