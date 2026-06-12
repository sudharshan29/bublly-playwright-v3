import type { Page } from '@playwright/test';

export function inboxLocators(page: Page) {
  return {
    conversationItems:   page.locator('[class*="receiver-bg"]'),
    newConversationBtn:  page.locator('#tour-step-new-conversation'),
    newConvModal:        page.locator('[aria-modal="true"]'),
    recipientInput:      page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]'),
    // ProseMirror contenteditable — has no HTML placeholder attribute.
    // getByPlaceholder() does NOT work here; target by role + multiline attribute instead.
    messageInput:        page.locator('[role="textbox"][aria-multiline="true"]').first(),
    modalMessageInput:   page.locator('[aria-modal="true"] [role="textbox"][aria-multiline="true"]'),
    sendBtn:             page.locator('[aria-modal="true"]').getByRole('button').filter({ hasNot: page.locator('[aria-label]') }).last(),

    statusDropdown:      page.getByRole('combobox').filter({ hasText: /\d{2,}/ }).first(),
    statusOpen:          page.getByRole('option', { name: /Open/i }),
    statusSnoozed:       page.getByRole('option', { name: /Snoozed/i }),
    statusClosed:        page.getByRole('option', { name: /Closed/i }),
    statusArchived:      page.getByRole('option', { name: /Archived/i }),

    filterAll:           page.getByText('All', { exact: true }).first(),
    filterMine:          page.getByText('My Inbox', { exact: true }).first(),
    filterUnassigned:    page.getByText('Unassigned', { exact: true }).first(),
    inboxSettingsLink:   page.getByText('Inbox Settings', { exact: true }).first(),

    // Conversation detail — reply composer (placeholder confirms it is the compose area)
    summarizeBtn:        page.getByRole('button', { name: 'Summarize' }),
    bubAiBtn:            page.getByRole('button', { name: 'Bub AI Suggestions' }),

    // Detail panel tabs
    detailsTab:          page.getByRole('button', { name: 'Details',     exact: true }),
    descriptionTab:      page.getByRole('button', { name: 'Description', exact: true }),
    briefTab:            page.getByRole('button', { name: 'Brief',       exact: true }),

    // Detail sidebar fields
    noteTextbox:         page.getByRole('textbox', { name: 'Add a Note' }),
    userDataSection:     page.getByText('User Data', { exact: true }).first(),

    // Use the more specific headerPadding div that contains the ticket detail header (not the inbox list header)
    // Two elements match [class*="headerPadding"]; the ticket detail one contains action buttons/icons
    detailPanel:         page.locator('[class*="headerPadding"]').nth(1),
    contactName:         page.locator('span[class*="truncate"][class*="flex-grow"]').first(),
    messageThread:       page.locator('[class*="flex-col-reverse"][class*="scroll-box"]'),

    // "Search here" in the top nav bar triggers a center overlay; after clicking, the real input appears
    searchTrigger:       page.getByText('Search here', { exact: false }).first(),
    // Confirmed from live DOM: the search overlay input has placeholder "Search here..."
    searchInput:         page.getByPlaceholder('Search here...'),
    // Conversation header action icons — div elements, NOT <button>.
    // All 4 share class "cursor-pointer ... rounded-full ... dark:border-selected-grey-100".
    // The new-conversation button has dark:border-[#262626] instead, so it's excluded.
    // Order (left to right): 0=Snooze, 1=Set Unread, 2=Copy Link, 3=More Options
    snoozeBtn:           page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]').first(),
    moreOptionsBtn:      page.locator('div[class*="cursor-pointer"][class*="rounded-full"][class*="dark:border-selected-grey-100"]').last(),

    // Snooze menu — opens as role="dialog" with plain div items (NOT role="menuitem").
    // Options confirmed from live DOM: Later Today, Tomorrow, Next Week, One Week, Next Month, Custom
    snoozeTomorrow:      page.getByRole('dialog').getByText('Tomorrow', { exact: true }),
    snoozeNextWeek:      page.getByRole('dialog').getByText('Next Week', { exact: true }),
    snoozeCustom:        page.getByRole('dialog').getByText('Custom', { exact: true }),

    // More Options menu items (also plain divs inside role="dialog")
    closeConvMenuItem:   page.getByRole('dialog').getByText('Close Conversation', { exact: true }),
    archiveTicketMenuItem: page.getByRole('dialog').getByText('Archive Ticket',    { exact: true }),

    // Close confirmation dialog buttons
    closeConfirmBtn:     page.getByRole('button', { name: 'Close',  exact: true }),
    cancelConfirmBtn:    page.getByRole('button', { name: 'Cancel', exact: true }),

    // Sidebar locked feature sections (free plan shows 🔒 Upgrade text — NOT a <button>)
    groupsSidebarItem:    page.getByText('Groups',      { exact: true }),
    customViewSidebarItem: page.getByText('Custom View', { exact: true }),
    // "Upgrade" is a plain text node inside a generic div (no role="button").
    // Ordered top-to-bottom: Groups (nth 0), Custom View (nth 1)
    upgradeTexts:         page.getByText('Upgrade', { exact: true }),

    // Paywall / upgrade dialog that may open when clicking the Upgrade text
    upgradeModal:        page.getByRole('dialog').filter({ hasText: /upgrade|plan|billing/i }),

    aiSpinner:           page.locator('[class*="ai-spinner"], [class*="loading"]').first(),
    aiResponse:          page.locator('[class*="ai-response"], [class*="ai-content"]').first(),
  };
}
