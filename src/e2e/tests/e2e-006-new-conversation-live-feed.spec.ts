import { test, expect } from '../fixtures/e2e.fixture';
import { TIMEOUTS }     from '../../core/constants/timeouts';

// TC_E2E_006 — New Conversation → Dashboard Live Feed
//
// Cross-module boundary: Inbox (create new conversation) → Dashboard (live feed)
// What this proves: a conversation created from the Inbox new-conversation flow
// appears in the dashboard Live Feed, validating cross-module real-time data flow.
//
// Bug class caught: live feed not reflecting newly created conversations, or
// new conversation routing to wrong inbox/project.

test.describe('E2E — New Conversation → Dashboard Live Feed @e2e', () => {
  test.setTimeout(180_000);

  test('TC_E2E_006 conversation created in inbox appears in dashboard live feed', async ({
    page,
    inboxPage,
    dashboardPage,
  }) => {
    // Step 1: navigate to inbox and open the New Conversation modal.
    // openNewConversationModal() clicks the stable id="tour-step-new-conversation"
    // button and waits for the modal — confirmed working in
    // src/modules/inbox/tests/inbox-new-conversation.spec.ts (TC_INB_033-036).
    await inboxPage.goto();
    await inboxPage.openNewConversationModal();

    // Step 2: fill the recipient. The modal's recipient input has
    // placeholder="Choose a receiver" — it is NOT input[type="email"] and its
    // placeholder does not contain "email" or "contact" (that mismatch was the
    // actual root cause of this test's prior skip). pressSequentially fires
    // real keystrokes, which is required to trigger the autocomplete listener.
    const modal = page.locator('[aria-modal="true"]').first();
    const recipientInput = modal.locator('input[placeholder="Choose a receiver"]');
    const uniqueEmail = `e2e-006-${Date.now()}@mailinator.com`;
    await recipientInput.click();
    await recipientInput.pressSequentially(uniqueEmail, { delay: 70 });

    // A freshly timestamped email never matches an existing contact, so
    // "Create New Contact" is always the (only) autocomplete result.
    const dropdown = modal.getByRole('list');
    await dropdown.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await modal.getByRole('listitem').filter({ hasText: 'Create New Contact' }).click();

    // "Add new contact" dialog — Name is required before it can be submitted.
    const addContactHeading = page.getByRole('heading', { name: 'Add new contact', exact: true });
    await expect(addContactHeading).toBeVisible({ timeout: TIMEOUTS.element });
    await page.getByPlaceholder('Enter Name').fill(`E2E 006 Test ${Date.now()}`);
    await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
    // Must confirm the dialog closed before the backdrop clears and the main
    // modal becomes interactive again.
    await expect(addContactHeading).not.toBeVisible({ timeout: TIMEOUTS.element });

    // Step 3: fill the message body. This is a ProseMirror contenteditable —
    // it has no HTML placeholder, so it must be targeted via role=textbox.
    const messageArea = modal.locator('[role="textbox"]').first();
    await messageArea.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await messageArea.fill(`TC_E2E_006 automated live-feed check ${Date.now()}`);

    // Step 4: send, capturing the API response so we know the EXACT ticket
    // code that was created (e.g. "FRE519_2126"). This lets Step 5 assert on
    // an exact, unambiguous value instead of guessing at feed content.
    const sendBtn = modal.getByRole('button', { name: 'Send', exact: true });
    await sendBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    const [startConversationResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/customer/start-conversation') && res.ok(),
        { timeout: TIMEOUTS.navigation },
      ),
      sendBtn.click(),
    ]);
    const responseBody = await startConversationResponse.json();
    const ticketCode: string | undefined = responseBody?.data?.ticket?.ticket_code;
    expect(ticketCode, 'start-conversation response must include a ticket_code').toMatch(/^FRE\d+_\d+$/);

    // Modal closes on successful send.
    await expect(modal).not.toBeVisible({ timeout: TIMEOUTS.navigation });

    // Step 5: the dashboard Live Feed must reflect the new conversation.
    // The feed does not surface the new contact's name (the product renders
    // "Untitled" for freshly created conversations — verified via live
    // inspection), so the stable, exact signal is the ticket code returned by
    // the create call. Real-time propagation can lag by a few seconds in QA,
    // so poll with reloads within a bounded window rather than a single check.
    await dashboardPage.goto();
    await dashboardPage.loc.liveFeedItems.first().waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });

    const feedContainsTicket = async (): Promise<boolean> => {
      const texts = await dashboardPage.loc.liveFeedItems.allTextContents();
      return texts.some((t) => t.includes(ticketCode!));
    };

    let found = await feedContainsTicket();
    const deadline = Date.now() + 30_000;
    while (!found && Date.now() < deadline) {
      await page.waitForTimeout(3_000);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await dashboardPage.loc.liveFeedItems.first().waitFor({ state: 'visible', timeout: TIMEOUTS.element }).catch(() => {});
      found = await feedContainsTicket();
    }

    expect(found, `expected Live Feed to contain newly created ticket ${ticketCode}`).toBe(true);
  });
});
