import type { Page } from '@playwright/test';

export function dashboardLocators(page: Page) {
  // ── Welcome banner ─────────────────────────────────────────────────────
  const welcomeHeading = page.getByRole('heading', { level: 1 });
  const welcomeSubtext = page.getByText("Let's make customers smile today", { exact: false });

  // ── Top nav ────────────────────────────────────────────────────────────
  const projectDropdownBtn  = page.getByRole('button').filter({ hasText: /Freeplan automation testing/i });
  const searchBarTrigger    = page.locator('#tour-step-search-bar');
  // Bell wrapper has id="tour-step-notifications"; contains an SVG icon (not img)
  const notificationBell    = page.locator('#tour-step-notifications');

  // ── Sidebar nav ────────────────────────────────────────────────────────
  // Bublly logo — clicking navigates to /dashboard
  const bubllyLogo = page.locator('img[alt="bubllyIcon"]').first();

  // ── Active Workspace ────────────────────────────────────────────────────
  const workspaceLabel      = page.getByText('Active Workspace', { exact: true });
  const workspaceCombobox   = page.getByRole('combobox').first();
  const workspaceCreateNew  = page.getByText('Create New Workspace', { exact: false });

  // ── Projects ────────────────────────────────────────────────────────────
  const projectsHeading    = page.getByRole('heading', { level: 3 }).filter({ hasText: /Projects/ });
  const projectCardHeading = page.getByRole('heading', { level: 4 });
  // Active badge lives inside the project card; first() guards against multi-project accounts
  const projectActiveBadge = page.getByText('Active', { exact: true }).first();
  const projectMoreOptions = page.getByRole('button', { name: 'More options' });
  const projectSettingsOpt = page.getByText('Settings', { exact: true }).first();
  const projectArchiveOpt  = page.getByText('Archive Project', { exact: true });

  // ── Assigned To Me ──────────────────────────────────────────────────────
  const assignedHeading    = page.getByRole('heading', { level: 2 }).filter({ hasText: /Assigned To Me/ });
  const viewAllBtn         = page.getByRole('button', { name: 'View all' });
  const assignedTable      = page.getByRole('table');
  const assignedTableRows  = page.getByRole('row').filter({ hasText: /FRE\d+/ });
  // "View all" modal uses aria-modal (not role="dialog"); backdrop is div.fixed.inset-0
  const assignedModal      = page.locator('[aria-modal]').first();
  // Modal title is an h3 inside the modal panel
  const assignedModalTitle = page.getByRole('heading', { level: 3 }).filter({ hasText: /Assigned Tickets/ });

  // ── Live Feed ────────────────────────────────────────────────────────────
  const liveFeedHeading = page.getByRole('heading', { level: 2 }).filter({ hasText: /Live Feed/ });
  // Only the FIRST item has id="tour-step-activity-item"; all 20 items are div siblings in its parent
  const liveFeedItems   = page.locator('#tour-step-activity-item').locator('xpath=../div');

  // ── Notification panel ───────────────────────────────────────────────────
  const notificationPanelTitle = page.getByRole('heading', { name: 'Notification' })
    .or(page.getByText('Notification', { exact: true }).first());
  // Tabs are buttons; "Unseen" tab shows count like "Unseen (4)" so use regex
  const notifTabAll    = page.getByRole('button', { name: 'All',    exact: true });
  const notifTabUnseen = page.getByRole('button', { name: /^Unseen/ });
  const notifEmptyState = page.getByText('No unread notifications', { exact: true });
  // Close button: the last cursor-pointer div in the panel header (an SVG icon, not a <button>)
  const notifCloseBtn  = page.getByRole('heading', { name: 'Notification' })
    .locator('..')
    .locator('[class*="cursor-pointer"]').last();

  // ── Global Search (Command Palette) ──────────────────────────────────────
  // Dialog has role="dialog" but no accessible name; input is plain text input (not combobox)
  const searchModal       = page.getByRole('dialog');
  const searchModalInput  = searchModal.locator('input[placeholder*="Search"]');
  // Open-state marker: the search input is only present while the dialog is open
  const searchIsOpen      = searchModal.locator('input[placeholder*="Search"]');
  const searchSuggestions = page.getByRole('listbox', { name: 'Suggestions' });
  // Filter tabs are <span> elements that appear after typing; scope to dialog
  const searchTabAll         = searchModal.locator('span').filter({ hasText: /^All$/ }).first();
  const searchTabMessages    = searchModal.locator('span').filter({ hasText: /^Messages$/ }).first();
  const searchTabContacts    = searchModal.locator('span').filter({ hasText: /^Contacts$/ }).first();
  const searchTabCollections = searchModal.locator('span').filter({ hasText: /^Collections$/ }).first();
  const searchTabArticles    = searchModal.locator('span').filter({ hasText: /^Articles$/ }).first();
  // Result section headers — only appear in results area (contain count "(N)")
  const searchMsgSection  = searchSuggestions.locator('div').filter({ hasText: /Messages.*\d+/ }).first();
  const searchContSection = searchSuggestions.locator('div').filter({ hasText: /Contacts.*\d+/ }).first();
  // Clickable result items inside the listbox
  const searchResultLinks = searchSuggestions.getByRole('option')
    .or(searchSuggestions.locator('div[class*="cursor"]').filter({ has: page.locator('p') }));

  return {
    welcomeHeading,
    welcomeSubtext,
    projectDropdownBtn,
    searchBarTrigger,
    notificationBell,
    bubllyLogo,
    workspaceLabel,
    workspaceCombobox,
    workspaceCreateNew,
    projectsHeading,
    projectCardHeading,
    projectActiveBadge,
    projectMoreOptions,
    projectSettingsOpt,
    projectArchiveOpt,
    assignedHeading,
    viewAllBtn,
    assignedTable,
    assignedTableRows,
    assignedModal,
    assignedModalTitle,
    liveFeedHeading,
    liveFeedItems,
    notificationPanelTitle,
    notifTabAll,
    notifTabUnseen,
    notifEmptyState,
    notifCloseBtn,
    searchModal,
    searchModalInput,
    searchIsOpen,
    searchSuggestions,
    searchTabAll,
    searchTabMessages,
    searchTabContacts,
    searchTabCollections,
    searchTabArticles,
    searchMsgSection,
    searchContSection,
    searchResultLinks,
  };
}

export type DashboardLocators = ReturnType<typeof dashboardLocators>;
