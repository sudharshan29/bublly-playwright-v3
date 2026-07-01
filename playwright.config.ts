import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.qa' });

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 4,
  expect: { timeout: 20_000 },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { outputFolder: path.resolve(__dirname, 'allure-results'), detail: true, suiteTitle: true }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://qa-desk.bublly.com',
    storageState: '.auth/free-user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
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
