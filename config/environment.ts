import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

export const env = {
  baseUrl:    process.env.BASE_URL     ?? 'https://qa-desk.bublly.com',
  // Bublly REST API lives on a SEPARATE subdomain from the web app
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://api-qa-desk.bublly.com',
  freeUser: {
    email:    process.env.FREE_USER_EMAIL ?? '',
    password: process.env.FREE_USER_PASS  ?? '',
  },
  paidUser: {
    email:    process.env.PAID_USER_EMAIL ?? '',
    password: process.env.PAID_USER_PASS  ?? '',
  },
  // Bublly workspace IDs — required for inbox URL construction
  // Confirmed URL: /project/{uuid}/inbox/{inboxId}/all/open/ticket/{ticketId}
  workspace: {
    projectId: process.env.QA_PROJECT_ID ?? '',
    inboxId:   process.env.QA_INBOX_ID   ?? '',
  },
  isFreePlan:       process.env.IS_FREE_PLAN       === 'true',
  hasWidgetChannel: process.env.HAS_WIDGET_CHANNEL === 'true',
  // Customer-facing Help Center widget — used by seed to create real inbox tickets
  helpCenterUrl:    process.env.HELP_CENTER_URL ?? 'https://comp-823e2b.qa-help.bublly.com',
};
