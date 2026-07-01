/**
 * seed-starter-inbox.ts
 *
 * Creates open conversations in the Starter plan inbox by sending real messages
 * through the Starter Help Center widget at STARTER_HELP_CENTER_URL.
 *
 * Flow: open widget → greeting card auto-opens → Ask a question → type message → send email → confirm
 * Each run creates N_TICKETS open conversations so the inbox functional tests have data.
 *
 * Usage:
 *   npm run seed:starter
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

import { chromium } from '@playwright/test';
import { env }      from '../config/environment';
import { v4 as uuid } from 'uuid';

const N_TICKETS = 3;      // number of open conversations to seed
const WIDGET_TIMEOUT = 30_000; // ms to wait for widget UI — if it doesn't appear, the widget is broken

// Returns true if the widget rendered its UI, false if it timed out (broken environment).
async function sendWidgetMessage(label: string, message: string): Promise<boolean> {
  const browser = await chromium.launch();
  const ctx     = await browser.newContext({ ignoreHTTPSErrors: true });
  const page    = await ctx.newPage();

  try {
    console.log(`  [${label}] Opening ${env.starterHelpCenterUrl} ...`);
    await page.goto(env.starterHelpCenterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Give the widget script time to inject its iframe
    await page.waitForTimeout(5_000);

    // Widget iframe: starter plan uses #bublly-widget id; fallback to src match
    const widgetFrame = page.frameLocator('#bublly-widget, iframe[src*="widget.bublly.com"]');

    // New widget UI (july-batch-project): widget auto-opens to the greeting card directly —
    // no launcher bubble to click. Wait for "Start Chat" button, which is the entry point.
    const startBtn    = widgetFrame.getByRole('button', { name: /start chat/i });
    const askQuestion = widgetFrame.getByText(/ask a question/i).first();

    console.log(`  [${label}] Waiting for widget to be ready...`);
    const widgetReady = await startBtn
      .waitFor({ state: 'visible', timeout: WIDGET_TIMEOUT })
      .then(() => true)
      .catch(() => false);

    if (!widgetReady) {
      console.warn(`  [${label}] Widget UI did not render within ${WIDGET_TIMEOUT / 1000}s — starter widget may be misconfigured in QA.`);
      return false;
    }

    console.log(`  [${label}] Clicking Start Chat...`);
    await startBtn.click();
    await askQuestion.waitFor({ state: 'visible', timeout: 15_000 });

    console.log(`  [${label}] Selecting "Ask a question"...`);
    await askQuestion.click();

    const chatInput = widgetFrame.getByRole('textbox', { name: 'Message input' });
    const sendBtn   = widgetFrame.getByRole('button', { name: 'Send message' });

    const waitEditable = async () => {
      await chatInput.waitFor({ state: 'visible', timeout: 15_000 });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (await chatInput.getAttribute('contenteditable') === 'true') return;
        await page.waitForTimeout(800);
      }
    };

    const typeAndSend = async (text: string) => {
      await waitEditable();
      await chatInput.click();
      await chatInput.pressSequentially(text, { delay: 30 });
      await sendBtn.click();
      await page.waitForTimeout(1_500);
    };

    console.log(`  [${label}] Sending message: "${message}"`);
    await typeAndSend(message);

    const visitorEmail = `qa.starter.${Date.now()}@mailinator.com`;
    console.log(`  [${label}] Sending visitor email: ${visitorEmail}`);
    await typeAndSend(visitorEmail);

    console.log(`  [${label}] Sending confirmation...`);
    await typeAndSend('yes');

    console.log(`  [${label}] Message flow complete. Ticket will appear in starter inbox shortly.`);
    await page.waitForTimeout(3_000);
    return true;

  } finally {
    await browser.close();
  }
}

export async function seedStarterInbox(count = N_TICKETS): Promise<void> {
  console.log('[seed-starter-inbox] Starting...');
  console.log(`[seed-starter-inbox] Starter Help Center: ${env.starterHelpCenterUrl}`);
  console.log(`[seed-starter-inbox] Target inbox ID: ${env.starter.inboxId}`);
  console.log(`[seed-starter-inbox] Creating ${count} open conversation(s)...\n`);

  let consecutiveFailures = 0;

  for (let i = 1; i <= count; i++) {
    const label   = `ticket-${i}`;
    const message = `QA Starter Seed ${i} — ${uuid().slice(0, 8)}`;
    try {
      const ok = await sendWidgetMessage(label, message);
      if (ok) {
        console.log(`  [${label}] Done.\n`);
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
        console.warn(`  [${label}] Widget unavailable — skipping.\n`);
        // Fast-fail: if the widget isn't loading at all, stop wasting time
        if (consecutiveFailures >= 2) {
          console.warn('[seed-starter-inbox] Widget not available in this QA environment.');
          console.warn('  → Report to tech lead: starter-project.qa-help.bublly.com widget is misconfigured.');
          console.warn('  → Dependent tests (TC_INB_WGT_001, TC_INB_WGT_002) will be skipped.\n');
          break;
        }
      }
    } catch (err) {
      consecutiveFailures++;
      console.error(`  [${label}] FAILED: ${err}\n`);
      if (consecutiveFailures >= 2) {
        console.warn('[seed-starter-inbox] Aborting seed after 2 consecutive failures.\n');
        break;
      }
    }
  }

  console.log('[seed-starter-inbox] Seeding complete (some tickets may be missing if widget is unavailable).');
  console.log(`  → https://qa-desk.bublly.com/project/${env.starter.projectId}/inbox/${env.starter.inboxId}/all/open`);
}

// Allow running directly via: npm run seed:starter
if (require.main === module) {
  seedStarterInbox().catch(e => {
    console.error('[seed-starter-inbox] Fatal:', e);
    process.exit(1);
  });
}
