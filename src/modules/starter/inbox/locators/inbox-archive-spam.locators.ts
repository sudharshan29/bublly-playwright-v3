import type { Page } from '@playwright/test';

export const inboxArchiveSpamLocators = (page: Page) => ({
  // ── Sidebar trigger ───────────────────────────────────────────────────
  sidebarLink:      page.getByText('Archive & spam', { exact: true }).first(),

  // ── Page header ───────────────────────────────────────────────────────
  heading:          page.getByRole('heading', { level: 1 }),
  archiveTabBtn:    page.getByRole('button', { name: 'Archive', exact: true }),
  spamTabBtn:       page.getByRole('button', { name: 'Spam',    exact: true }),

  // ── Action buttons ────────────────────────────────────────────────────
  searchBtn:        page.getByRole('button', { name: 'Search'  }),
  sortBtn:          page.getByRole('button', { name: 'Sort'    }),
  filterBtn:        page.getByRole('button', { name: 'Filter'  }),

  // ── Table ─────────────────────────────────────────────────────────────
  table:            page.getByRole('table'),
  colTicketDetails: page.getByRole('columnheader', { name: 'Ticket ID & Details' }),
  colAssignee:      page.getByRole('columnheader', { name: 'Assignee'            }),
  colCustomerName:  page.getByRole('columnheader', { name: 'Customer Name'       }),
  colType:          page.getByRole('columnheader', { name: 'Type'                }),
  colStatus:        page.getByRole('columnheader', { name: 'Status'              }),
  colTag:           page.getByRole('columnheader', { name: 'Tag'                 }),
  colCreatedOn:     page.getByRole('columnheader', { name: 'Created On'          }),
  emptyState:       page.getByRole('cell',         { name: 'No records found'    }),

  // Data rows (excludes header row)
  tableRows:        page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }),
});
