import type { Page } from '@playwright/test';

export function inboxLocators(page: Page) {
  // Unique anchor: class "relative flex justify-between items-center headerPadding w-full"
  // Only this panel (ticket detail conversation header) carries both "headerPadding" and "w-full".
  // Only rendered when a ticket is loaded — correct wait signal for gotoConversation().
  const detailHeaderBar = page.locator('[class*="headerPadding"][class*="w-full"]');

  return {
    // [class~="group"] = word-boundary match for Tailwind's group modifier (avoids "group-hover:" etc.)
    // Combined with [class*="receiver-bg"] the pair is unique to conversation list row elements.
    conversationItems:    page.locator('[class~="group"][class*="receiver-bg"]'),

    newConversationBtn:   page.locator('#tour-step-new-conversation'),
    // .first() guards against a second aria-modal appearing (e.g. "Add new contact" dialog)
    newConvModal:         page.locator('[aria-modal="true"]').first(),
    recipientInput:       page.locator('[aria-modal="true"] input[placeholder="Choose a receiver"]'),
    // ProseMirror contenteditable — has no HTML placeholder attribute.
    // getByPlaceholder() does NOT work here; target by role + multiline attribute instead.
    messageInput:         page.locator('[role="textbox"][aria-multiline="true"]').first(),
    modalMessageInput:    page.locator('[aria-modal="true"] [role="textbox"][aria-multiline="true"]'),
    // Resolved via accessible name — immune to positional DOM changes
    sendBtn:              page.locator('[aria-modal="true"]').first().getByRole('button', { name: 'Send', exact: true }),

    // Filter requires at least one digit — broadened from \d{2,} which broke on inbox counts < 10.
    statusDropdown:       page.getByRole('combobox').filter({ hasText: /\d+/ }).first(),
    statusOpen:           page.getByRole('option', { name: /Open/i }),
    statusSnoozed:        page.getByRole('option', { name: /Snoozed/i }),
    statusClosed:         page.getByRole('option', { name: /Closed/i }),
    statusArchived:       page.getByRole('option', { name: /Archived/i }),

    filterAll:            page.getByText('All', { exact: true }).first(),
    filterMine:           page.getByText('My Inbox', { exact: true }).first(),
    filterUnassigned:     page.getByText('Unassigned', { exact: true }).first(),
    inboxSettingsLink:    page.getByText('Inbox Settings', { exact: true }).first(),

    summarizeBtn:         page.getByRole('button', { name: 'Summarize' }),
    bubAiBtn:             page.getByRole('button', { name: 'Bub AI Suggestions' }),

    detailsTab:           page.getByRole('button', { name: 'Details',     exact: true }),
    descriptionTab:       page.getByRole('button', { name: 'Description', exact: true }),
    briefTab:             page.getByRole('button', { name: 'Brief',       exact: true }),

    noteTextbox:          page.getByRole('textbox', { name: 'Add a Note' }),
    userDataSection:      page.getByText('User Data', { exact: true }).first(),

    // Scoped to the detail header bar — only visible when a ticket is loaded
    detailPanel:          detailHeaderBar,
    // Scoped to the detail header bar — avoids matching contact names in the conversation list
    contactName:          detailHeaderBar.locator('span[class*="truncate"]').first(),
    // Only 1 match on the page — already unique
    messageThread:        page.locator('[class*="flex-col-reverse"][class*="scroll-box"]'),

    searchTrigger:        page.getByText('Search here', { exact: false }).first(),
    searchInput:          page.getByPlaceholder('Search here...'),

    // All 4 action icons scoped to the detail header bar — eliminates false matches elsewhere.
    // Order (left→right) confirmed from live DOM: 0=Snooze, 1=Set Unread, 2=Copy Link, 3=More Options
    snoozeBtn:            detailHeaderBar.locator('div[class*="rounded-full"][class*="cursor-pointer"]').nth(0),
    setUnreadBtn:         detailHeaderBar.locator('div[class*="rounded-full"][class*="cursor-pointer"]').nth(1),
    copyLinkBtn:          detailHeaderBar.locator('div[class*="rounded-full"][class*="cursor-pointer"]').nth(2),
    moreOptionsBtn:       detailHeaderBar.locator('div[class*="rounded-full"][class*="cursor-pointer"]').last(),

    // Radix UI Select — scoped to the Priority label row's parent container
    priorityCombo:        page.getByText('Priority', { exact: true }).locator('..').getByRole('combobox'),

    // Snooze menu — opens as role="dialog" with plain div items (NOT role="menuitem").
    snoozeTomorrow:       page.getByRole('dialog').getByText('Tomorrow',   { exact: true }),
    snoozeNextWeek:       page.getByRole('dialog').getByText('Next Week',  { exact: true }),
    snoozeCustom:         page.getByRole('dialog').getByText('Custom',     { exact: true }),

    closeConvMenuItem:    page.getByRole('dialog').getByText('Close Conversation', { exact: true }),
    archiveTicketMenuItem: page.getByRole('dialog').getByText(/archive ticket/i),

    closeConfirmBtn:      page.getByRole('button', { name: 'Close',  exact: true }),
    cancelConfirmBtn:     page.getByRole('button', { name: 'Cancel', exact: true }),

    groupsSidebarItem:    page.getByText('Groups',      { exact: true }),
    customViewSidebarItem: page.getByText('Custom View', { exact: true }),
    upgradeTexts:         page.getByText('Upgrade', { exact: true }),
    upgradeModal:         page.getByRole('dialog').filter({ hasText: /upgrade|plan|billing/i }),

    aiSpinner:            page.locator('[class*="ai-spinner"], [class*="loading"]').first(),
    aiResponse:           page.locator('[class*="ai-response"], [class*="ai-content"]').first(),
  };
}
