// Bublly API ticket status codes — used in direct API calls (seed check, data helpers).
// These are workspace-level enums returned by /chat/ticket_list and related endpoints.
export const API_STATUS = {
  STARTER_INBOX_OPEN: 8354,
  FREE_INBOX_OPEN:    6423,
} as const;
