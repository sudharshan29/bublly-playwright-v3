import type { Page } from '@playwright/test';

export function boardsLocators(page: Page) {
  // Right-side slide-in detail panel — distinct from settings modal
  const detailPanel = page.locator(
    '[class*="fixed"][class*="inset-0"][class*="z-50"][class*="justify-end"]',
  );

  // Icon toolbar — the parent of the .relative.w-7 search icon wrapper.
  // Scoping sort/filter/settings to this container prevents false matches elsewhere on the page.
  const iconBar = page.locator('.relative.w-7').first().locator('..');

  return {
    // ── Sidebar board links ───────────────────────────────────────────────
    bugBoardLink:         page.getByText('Bug',             { exact: true }).first(),
    featureBoardLink:     page.getByText('FeatureRequests', { exact: true }).first(),
    customBoardsLink:     page.getByText('Custom Boards',   { exact: true }).first(),

    // ── Board heading (main content area, not sidebar) ────────────────────
    boardHeading: page.locator('p').filter({ hasText: /^(Bug|FeatureRequests)$/ }).first(),

    // ── Header icons (search=1st, sort=2nd, filter=3rd, settings=4th) ─────
    // All icons are scoped to iconBar (parent of the .relative.w-7 search wrapper) so that
    // nth-child selectors only apply within the toolbar, not anywhere on the page.
    searchIcon:   page.locator('.relative.w-7 > svg').first(),
    sortIcon:     iconBar.locator('> div:nth-child(2) > svg').first(),
    filterIcon:   iconBar.locator('> div:nth-child(3) > svg').first(),
    settingsIcon: iconBar.locator('> div:nth-child(4) > svg').first(),
    searchInput:  page.locator('input[placeholder="Search here"]'),
    searchClearBtn: page.locator('span, button, div').filter({ hasText: '×' }).first(),

    // ── Sort dropdown ─────────────────────────────────────────────────────
    sortCreatedDate: page.getByText('Created Date', { exact: true }),
    sortDueDate:     page.getByText('Due Date',     { exact: true }),
    sortAssignee:    page.getByText('Assignee',     { exact: true }),
    sortPriority:    page.getByText('Priority',     { exact: true }).first(),
    sortApplyBtn:    page.getByRole('button', { name: 'Apply', exact: true }).first(),
    sortClearBtn:    page.getByRole('button', { name: 'Clear', exact: true }).first(),

    // ── Filter panel ──────────────────────────────────────────────────────
    filterPrioritySelect: page.getByText('Select priority', { exact: false }),
    filterTitleInput:     page.getByPlaceholder('Enter title'),
    filterApplyBtn:       page.getByRole('button', { name: 'Apply', exact: true }),
    filterClearBtn:       page.getByRole('button', { name: 'Clear', exact: true }),

    // ── Column headers ────────────────────────────────────────────────────
    openColumnLabel:  page.locator('p').filter({ hasText: /^Open$/ }).first(),
    doneColumnLabel:  page.locator('p').filter({ hasText: /^Done$/ }).first(),
    openColumnAddBtn: page.locator('.cursor-pointer.p-1 > svg').first(),
    doneColumnAddBtn: page.locator('.cursor-pointer.p-1 > svg').last(),

    // ── Ticket cards ──────────────────────────────────────────────────────
    // Cards are <button> elements whose text contains a ticket ID like FRE519_024
    ticketCards: page.getByRole('button').filter({ hasText: /FRE\d+_\d+/ }),

    // ── Add-ticket modals ─────────────────────────────────────────────────
    addBugModalTitle:     page.getByText('Report a Bug',      { exact: true }),
    addFeatureModalTitle: page.getByText('Request a Feature', { exact: true }),
    addTicketTitleInput:  page.getByPlaceholder('Enter a short, clear title'),
    addTicketDescInput:   page.locator('textarea').first(),
    // Primary submit button — different boards may use different labels
    addTicketSubmitBtn:   page.getByRole('button').filter({ hasText: /submit|create|report|send/i }).last(),

    // ── Detail (slide-in) panel ───────────────────────────────────────────
    detailPanel,
    detailTicketId:    detailPanel.getByText('Ticket ID', { exact: true }),
    detailAssignee:    detailPanel.getByText('Assignee',  { exact: true }),
    detailStatus:      detailPanel.getByText('Status',    { exact: true }),
    detailPriority:    detailPanel.getByText('Priority',  { exact: true }),
    descriptionTab:    page.getByRole('button', { name: 'Description', exact: true }),
    briefTab:          page.getByRole('button', { name: 'Brief',       exact: true }),
    detailsTab:        page.getByRole('button', { name: 'Details',     exact: true }),
    replyComposer:     page.getByPlaceholder('Start Conversation...'),

    // Kebab / "more options" trigger in the detail panel header — a 28x28 circular icon
    // (2nd of a pair) whose <svg> carries a distinguishing "group" class. Clicking it opens
    // a small floating menu (role="dialog") with "Show History" / "Email Chat Transcript" /
    // "Delete Ticket" — these are plain <div>s, not [role="menuitem"].
    detailMoreOptionsBtn: detailPanel.locator('svg.group'),
    deleteTicketMenuItem: page.getByText('Delete Ticket', { exact: false }).first(),
    // Confirmation modal's destructive action button ("Are you sure want to delete this
    // ticket. This action cannot be undone" / Cancel / Delete).
    deleteConfirmBtn:     page.getByRole('button', { name: 'Delete', exact: true }),

    // ── Settings modal ────────────────────────────────────────────────────
    settingsModalTitle:   page.getByText('Board Management Settings', { exact: true }),
    settingsAddColumnBtn: page.getByText('Add column', { exact: false }),
    settingsSaveBtn:      page.getByRole('button', { name: 'Save', exact: true }),
    settingsCloseBtn:     page.locator('button[aria-label="Close dialog"]'),

    // ── Locked / upgrade ──────────────────────────────────────────────────
    lockIcon:     page.locator('.lucide-lock, [class*="lucide-lock"]'),
    upgradeModal: page.getByRole('dialog').filter({ hasText: /upgrade|plan|billing/i }),
  };
}

export type BoardsLocators = ReturnType<typeof boardsLocators>;
