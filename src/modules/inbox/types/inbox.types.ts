// Bublly API status: 1=open, 3=closed, 4=archived, 5=snoozed — no "resolved" concept
export type InboxFilter        = 'open' | 'snoozed' | 'closed' | 'archived' | 'mine' | 'all';
export type ConversationStatus = 'open' | 'snoozed' | 'closed' | 'archived';
export type SnoozeOption       = 'tomorrow' | 'next-week' | 'custom';
