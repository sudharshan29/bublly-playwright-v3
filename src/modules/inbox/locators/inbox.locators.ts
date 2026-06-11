import type { Page } from '@playwright/test';

export function inboxLocators(page: Page) {
  return {
    conversationItems:   page.locator('[class*="receiver-bg"]'),
    newConversationBtn:  page.locator('#tour-step-new-conversation'),
    newConvModal:        page.locator('[aria-modal="true"]'),
    recipientInput:      page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]'),
    messageInput:        page.getByPlaceholder(/Start Conversation/i),
    modalMessageInput:   page.locator('[aria-modal="true"] [role="textbox"][aria-multiline="true"]'),
    sendBtn:             page.locator('[aria-modal="true"]').getByRole('button').filter({ hasNot: page.locator('[aria-label]') }).last(),

    statusDropdown:      page.getByRole('combobox').filter({ hasText: /\d{2,}/ }).first(),
    statusOpen:          page.getByRole('option', { name: /Open/i }),
    statusSnoozed:       page.getByRole('option', { name: /Snoozed/i }),
    statusClosed:        page.getByRole('option', { name: /Closed/i }),
    statusArchived:      page.getByRole('option', { name: /Archived/i }),

    filterAll:           page.getByText('All', { exact: true }).first(),
    filterMine:          page.getByText('My Inbox', { exact: true }).first(),

    // Use the more specific headerPadding div that contains the ticket detail header (not the inbox list header)
    // Two elements match [class*="headerPadding"]; the ticket detail one contains action buttons/icons
    detailPanel:         page.locator('[class*="headerPadding"]').nth(1),
    contactName:         page.locator('span[class*="truncate"][class*="flex-grow"]').first(),
    messageThread:       page.locator('[class*="flex-col-reverse"][class*="scroll-box"]'),

    // "Search here" in the top nav bar triggers a center overlay; after clicking, the real input appears
    searchTrigger:       page.getByText('Search here', { exact: false }).first(),
    // Confirmed from live DOM: the search overlay input has placeholder "Search here..."
    searchInput:         page.getByPlaceholder('Search here...'),
    snoozeBtn:           page.getByRole('button', { name: /snooze/i }),
    snoozeTomorrow:      page.getByRole('menuitem', { name: 'Tomorrow' }),

    aiSpinner:           page.locator('[class*="ai-spinner"], [class*="loading"]').first(),
    aiResponse:          page.locator('[class*="ai-response"], [class*="ai-content"]').first(),
  };
}
