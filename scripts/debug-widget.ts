/**
 * debug-widget.ts — one-shot diagnostic: what does the starter help center show?
 * Run: npx ts-node --project tsconfig.json scripts/debug-widget.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import * as fs      from 'fs';
import { chromium } from '@playwright/test';
import { env }      from '../config/environment';

(async () => {
  fs.mkdirSync('debug-screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ ignoreHTTPSErrors: true });
  const page    = await ctx.newPage();

  console.log('Navigating to:', env.starterHelpCenterUrl);
  try {
    await page.goto(env.starterHelpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (e) {
    console.error('goto failed:', e);
  }

  await page.waitForTimeout(3_000);
  await page.screenshot({ path: 'debug-screenshots/01-after-load.png', fullPage: true });
  console.log('Screenshot 01: after load saved');
  console.log('Page title:', await page.title());
  console.log('Page URL:',   page.url());

  // Check if #bublly-widget is present
  const widgetEl = page.locator('#bublly-widget');
  const attached = await widgetEl.count() > 0;
  console.log('#bublly-widget in DOM:', attached);
  if (attached) {
    const tagName = await widgetEl.evaluate((el) => el.tagName).catch(() => 'unknown');
    const visible = await widgetEl.isVisible().catch(() => false);
    console.log('#bublly-widget tagName:', tagName, '| visible:', visible);
  }

  // Print visible text on the page
  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('Body text (first 500 chars):', bodyText.slice(0, 500));

  // Look for any buttons on the page
  const btns = await page.getByRole('button').all();
  console.log('Page-level buttons count:', btns.length);
  for (const btn of btns.slice(0, 10)) {
    const txt = await btn.textContent().catch(() => '');
    const name = await btn.getAttribute('aria-label').catch(() => '');
    console.log('  button:', JSON.stringify(txt?.trim()), '| aria-label:', name);
  }

  // If iframe, inspect its content
  const frames = page.frames();
  console.log('Frames on page:', frames.length);
  for (const f of frames) {
    console.log('  frame url:', f.url());
    const fBtns = await f.getByRole('button').all();
    console.log('  frame buttons:', fBtns.length);
    for (const btn of fBtns.slice(0, 10)) {
      const txt  = await btn.textContent().catch(() => '');
      const name = await btn.getAttribute('aria-label').catch(() => '');
      console.log('    button:', JSON.stringify(txt?.trim()), '| aria-label:', name);
    }
  }

  await page.waitForTimeout(10_000);
  await page.screenshot({ path: 'debug-screenshots/02-after-10s-wait.png', fullPage: true });
  console.log('Screenshot 02: after 10s wait saved');

  // Re-check frames
  const frames2 = page.frames();
  console.log('Frames after 10s:', frames2.length);
  for (const f of frames2) {
    console.log('  frame url:', f.url());
    const fBtns = await f.getByRole('button').all();
    console.log('  frame buttons:', fBtns.length);
    for (const btn of fBtns.slice(0, 10)) {
      const txt  = await btn.textContent().catch(() => '');
      const name = await btn.getAttribute('aria-label').catch(() => '');
      console.log('    button:', JSON.stringify(txt?.trim()), '| aria-label:', name);
    }
  }

  await browser.close();
  console.log('Done. Screenshots saved to debug-screenshots/');
})();
