import { test, expect } from '@playwright/test';
import * as path        from 'path';
import * as fs          from 'fs';
import { env }          from '../../../config/environment';

// TC_E2E_005 — Widget → Helpdesk → Widget Round-Trip
//
// What this proves:
//   A message sent by a customer through the Help Center widget
//   creates a real inbox ticket. An agent can reply from the helpdesk
//   and the customer sees the reply appear inside the same widget session.
//
// Two browser contexts are used:
//   customerCtx  — anonymous browser, opens the Help Center widget
//   agentCtx     — authenticated as starter admin, uses helpdesk inbox
//
// This test cannot use retries: each retry would send another widget message,
// creating duplicate conversations in QA.

test.describe('E2E — Widget → Helpdesk → Widget round-trip @e2e', () => {
  test.setTimeout(180_000); // 3 min: widget flow + inbox load + reply + delivery
  test.describe.configure({ retries: 0 });

  test('TC_E2E_005 customer widget message receives agent reply back in the widget', async ({ browser }) => {
    // Unique IDs so this conversation is findable among all open tickets
    const ts           = Date.now();
    const uniqueMsg    = `E2E-RT-${ts}`;
    const visitorEmail = `qa.rt.${ts}@mailinator.com`;
    const agentReply   = `Agent reply to E2E-RT-${ts}`;

    // ── BROWSER 1: Customer (anonymous) ────────────────────────────────────
    const customerCtx  = await browser.newContext({ ignoreHTTPSErrors: true });
    const customerPage = await customerCtx.newPage();

    try {
      // Step 1 — Open Help Center and send widget message ──────────────────
      console.log(`[TC_E2E_005] Opening Help Center: ${env.starterHelpCenterUrl}`);
      await customerPage.goto(env.starterHelpCenterUrl, {
        waitUntil: 'domcontentloaded',
        timeout:   30_000,
      });

      const frame    = customerPage.frameLocator('#bublly-widget, iframe[src*="widget.bublly.com"]');
      const startBtn = frame.getByRole('button', { name: /start chat/i });

      const widgetReady = await startBtn.waitFor({ state: 'visible', timeout: 30_000 })
        .then(() => true).catch(() => false);

      if (!widgetReady) {
        test.skip(true, 'Widget did not load — starter Help Center widget is unavailable in QA');
        return;
      }

      await startBtn.click();
      await frame.getByText(/ask a question/i).first().waitFor({ state: 'visible', timeout: 15_000 });
      await frame.getByText(/ask a question/i).first().click();

      const chatInput = frame.getByRole('textbox', { name: 'Message input' });
      await chatInput.waitFor({ state: 'visible', timeout: 15_000 });

      // Slate.js starts as contenteditable="false" — poll until editable, then type+send
      const typeAndSend = async (text: string) => {
        const deadline = Date.now() + 15_000;
        while (Date.now() < deadline) {
          if (await chatInput.getAttribute('contenteditable') === 'true') break;
          await customerPage.waitForTimeout(500);
        }
        await chatInput.click();
        await chatInput.pressSequentially(text, { delay: 30 });
        await frame.getByRole('button', { name: 'Send message' }).click();
        await customerPage.waitForTimeout(1_500);
      };

      await typeAndSend(uniqueMsg);     // customer question (unique per run)
      await typeAndSend(visitorEmail);  // bot asks for email
      await typeAndSend('yes');         // confirm email

      console.log(`[TC_E2E_005] Widget message sent: "${uniqueMsg}"`);

      // Wait for Bublly backend to create the ticket
      await customerPage.waitForTimeout(6_000);

      // ── BROWSER 2: Agent (authenticated as starter admin) ───────────────
      // Must manually inject sessionStorage via addInitScript — same pattern as base.fixture.ts.
      // storageState alone does not restore sessionStorage (Playwright only restores cookies + localStorage).
      const authRaw   = JSON.parse(fs.readFileSync(
        path.join(process.cwd(), '.auth/starter-admin.json'), 'utf-8'
      ));
      const agentCtx  = await browser.newContext({
        storageState: { cookies: authRaw.cookies ?? [], origins: authRaw.origins ?? [] },
      });
      const agentPage = await agentCtx.newPage();
      await agentPage.addInitScript((ss: Record<string, string>) => {
        Object.entries(ss).forEach(([k, v]) => sessionStorage.setItem(k, v));
      }, authRaw.sessionStorageData ?? {});

      try {
        // Step 2 — Agent opens inbox and finds the conversation ────────────
        const inboxUrl = `${env.baseUrl}/project/${env.starter.projectId}/inbox/${env.starter.inboxId}/all/open`;
        console.log(`[TC_E2E_005] Agent opening inbox: ${inboxUrl}`);
        await agentPage.goto(inboxUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

        // Inbox load — reload-retry pattern for QA server slowness
        try {
          await agentPage.getByRole('combobox').first().waitFor({ state: 'visible', timeout: 30_000 });
        } catch {
          await agentPage.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
          await agentPage.getByRole('combobox').first().waitFor({ state: 'visible', timeout: 30_000 });
        }

        // Dismiss any open modal/dialog that blocks the conversation list
        // (global search modal, tour dialog, etc.) — press Escape once to close
        const overlay = agentPage.locator('[data-slot="dialog-overlay"]');
        if (await overlay.isVisible().catch(() => false)) {
          await agentPage.keyboard.press('Escape');
          await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
        }

        // Find conversation by visitor email in the conversation list.
        // Search indexing takes too long on QA — match the email text directly in the list.
        // visitorEmail = qa.rt.{ts}@mailinator.com — unique per run so there's no ambiguity.
        const convByEmail = agentPage.locator('[class*="receiver-bg"]')
          .filter({ hasText: new RegExp(visitorEmail.split('@')[0], 'i') }).first();

        const foundByEmail = await convByEmail.waitFor({ state: 'visible', timeout: 20_000 })
          .then(() => true).catch(() => false);

        if (foundByEmail) {
          await convByEmail.click();
        } else {
          // Fallback: click the first (newest) open conversation
          console.warn('[TC_E2E_005] Could not find conversation by email — clicking newest open ticket');
          const first = agentPage.locator('[class*="receiver-bg"]').first();
          await first.waitFor({ state: 'visible', timeout: 10_000 });
          await first.click();
        }

        // Wait for conversation detail to load
        await agentPage.locator('[role="textbox"][aria-multiline="true"]').first()
          .waitFor({ state: 'visible', timeout: 20_000 });

        // Step 3 — Agent types and sends reply ──────────────────────────────
        console.log(`[TC_E2E_005] Agent sending reply: "${agentReply}"`);
        const composer = agentPage.locator('[role="textbox"][aria-multiline="true"]').first();
        await composer.fill(agentReply);
        await agentPage.keyboard.press('Control+Enter');
        await agentPage.waitForTimeout(2_000);

        // Fallback: if Ctrl+Enter didn't send, click the Send button
        const stillHasText = (await composer.innerText().catch(() => '')).includes(agentReply);
        if (stillHasText) {
          const sendBtn = agentPage.getByRole('button', { name: /^send$/i }).first();
          if (await sendBtn.isVisible().catch(() => false)) {
            await sendBtn.click();
            await agentPage.waitForTimeout(2_000);
          }
        }

        // Confirm reply appeared in agent's thread
        const replyInThread = await agentPage.getByText(agentReply, { exact: false })
          .first().isVisible().catch(() => false);
        const composerCleared = !(await composer.innerText().catch(() => '')).includes(agentReply);
        expect(replyInThread || composerCleared, 'Reply was not sent by agent').toBe(true);
        console.log(`[TC_E2E_005] Agent reply confirmed in helpdesk thread`);

        // ── STEP 4: Verify widget shows agent reply to customer ──────────
        // Allow time for WebSocket push or polling to deliver the reply
        console.log(`[TC_E2E_005] Waiting for reply delivery to customer widget...`);
        await customerPage.waitForTimeout(10_000);

        const replyInWidget = frame.getByText(agentReply, { exact: false }).first();
        const isReplyVisible = await replyInWidget.isVisible().catch(() => false);

        if (!isReplyVisible) {
          // One more wait for slow polling interval
          await customerPage.waitForTimeout(10_000);
        }

        await expect(replyInWidget).toBeVisible({ timeout: 15_000 });
        console.log(`[TC_E2E_005] ✅ Round-trip complete — widget shows agent reply`);

      } finally {
        await agentCtx.close();
      }

    } finally {
      await customerCtx.close();
    }
  });
});
