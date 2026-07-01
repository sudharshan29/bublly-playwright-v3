import type { Page } from '@playwright/test';

export function contactsLocators(page: Page) {
  return {
    // ── Sidebar ───────────────────────────────────────────────────────────
    pageHeading:        page.locator('p').filter({ hasText: /^Contacts$/ }).first(),
    sidebarAll:         page.locator('div').filter({ hasText: /^All/ }).and(page.locator('[class*="cursor-pointer"]')).first(),
    sidebarUsers:       page.locator('div').filter({ hasText: /^Users/ }).and(page.locator('[class*="cursor-pointer"]')).first(),
    sidebarGuests:      page.locator('div').filter({ hasText: /^Guests/ }).first(),
    sidebarUnsubscribed:page.locator('div').filter({ hasText: /^Unsubscribed/ }).first(),
    sidebarBlocked:     page.locator('div').filter({ hasText: /^Blocked/ }).first(),

    // Count badges inside sidebar items (paragraph elements with numeric text)
    allCountBadge:         page.getByRole('complementary').locator('p').filter({ hasText: /^(\d+|99\+)$/ }).first(),
    usersCountBadge:       page.getByRole('complementary').locator('p').filter({ hasText: /^(\d+|99\+)$/ }).nth(1),

    // ── Toolbar ───────────────────────────────────────────────────────────
    // Scope to the parent of Import to avoid matching navigation buttons that also have img
    filterIconBtn:   page.getByRole('button', { name: 'Import' }).locator('..').getByRole('button').first(),
    searchInput:     page.getByRole('textbox', { name: 'Search by email or name...' }),
    searchClearBtn:  page.getByRole('button', { name: '✕' }),
    importBtn:       page.getByRole('button', { name: 'Import' }),
    addContactBtn:   page.getByRole('button', { name: /Add Contact/ }),

    // ── Contact table ─────────────────────────────────────────────────────
    contactTable:    page.getByRole('table'),
    nameColHeader:   page.getByRole('columnheader', { name: 'Name' }),
    emailColHeader:  page.getByRole('columnheader', { name: 'Email' }),
    activityColHeader: page.getByRole('columnheader', { name: 'Last Activity' }),
    contactRows:     page.getByRole('row').filter({ has: page.getByRole('link') }),
    columnSettingsBtn: page.getByRole('columnheader').last().getByRole('button'),

    // ── Pagination ────────────────────────────────────────────────────────
    paginationInfo:  page.locator('p').filter({ hasText: /Showing/ }).first(),

    // ── Add Contact modal ─────────────────────────────────────────────────
    addContactModal:       page.getByRole('heading', { name: 'Add Contact', level: 3 }),
    addContactNameInput:   page.getByRole('textbox', { name: 'Name' }),
    addContactEmailInput:  page.getByRole('textbox', { name: 'Email' }),
    addContactSubmitBtn:   page.getByRole('button', { name: 'Add Contact', exact: true }),
    addContactCloseBtn:    page.getByRole('button', { name: 'Close dialog' }),

    // ── Contact detail page ───────────────────────────────────────────────
    backBtn:                    page.getByRole('button', { name: 'Back' }),
    onlineStatus:               page.locator('p').filter({ hasText: /^(Offline|Online)$/ }).first(),
    blockAction:                page.locator('div').filter({ hasText: /^Block$/ }).last(),
    unsubscribeAction:          page.locator('div').filter({ hasText: /^(Unsubscribe|Resubscribe)$/ }).last(),
    muteAction:                 page.locator('div').filter({ hasText: /^(Mute Contact|Unmute Contact)$/ }).last(),
    newConversationBtn:         page.getByRole('button', { name: /New Conversation/ }),

    // Detail sections
    userDetailHeading:          page.getByRole('heading', { name: 'User Detail',           level: 3 }),
    conversationTimelineHeading:page.getByRole('heading', { name: 'Conversation Timeline', level: 3 }),
    sessionHistoryHeading:      page.getByRole('heading', { name: 'Session History',        level: 3 }),
    activitiesHeading:          page.getByRole('heading', { name: 'Activities',             level: 2 }),
    activitiesList:             page.getByRole('list').last(),

    // User Detail field values (generic containers next to label text)
    userDetailSection: page.getByRole('heading', { name: 'User Detail', level: 3 }).locator('..'),

    // ── Block confirmation dialog ─────────────────────────────────────────
    blockDialogHeading: page.locator('div').filter({ hasText: /^Block Contact$/ }).last(),
    blockReasonInput:   page.getByRole('textbox', { name: /reason/i }),
    blockCancelBtn:     page.getByRole('button', { name: 'Cancel' }),
    blockConfirmBtn:    page.getByRole('button', { name: 'Block', exact: true }),

    // ── Start a Conversation modal ────────────────────────────────────────
    newConvModalHeading:  page.getByRole('heading', { name: 'Start a Conversation', level: 3 }),
    newConvChannelSelect: page.getByRole('combobox').first(),
    newConvCloseBtn:      page.getByRole('button', { name: 'Close dialog' }),

    // ── Column settings dropdown ──────────────────────────────────────────
    colOptionName:        page.getByRole('button', { name: 'Name',          exact: true }),
    colOptionEmail:       page.getByRole('button', { name: 'Email',         exact: true }),
    colOptionLocation:    page.getByRole('button', { name: 'Location',      exact: true }),
    colOptionLanguage:    page.getByRole('button', { name: 'Language',      exact: true }),
    colOptionLastActivity:page.getByRole('button', { name: 'Last Activity', exact: true }),
  };
}

export type ContactsLocators = ReturnType<typeof contactsLocators>;
