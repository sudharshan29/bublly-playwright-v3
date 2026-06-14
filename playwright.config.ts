import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.qa' });

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Widget tests (smoke + ingestion) send real browser sessions to the QA Help Center.
  // Running 2 workers causes concurrent widget load that overwhelms the QA widget queue
  // (tickets never route within 120s polling window). Serial execution prevents this.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 1,
  expect: { timeout: 20_000 },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: true }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://qa-desk.bublly.com',
    storageState: '.auth/free-user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // QA subdomains (help center) use self-signed / untrusted SSL certs
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './src/core/setup/global-setup.ts',
});
