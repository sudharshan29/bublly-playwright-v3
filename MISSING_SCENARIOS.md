# Bublly Starter Plan — Missing Test Scenarios
> Discovered via hands-on MCP browser exploration as both **Starter Admin** and **Starter Agent**
> 
> Exploration date: 2026-06-24 | Account: atstarter@mailinator.com (admin) / atstarterus@mailinator.com (agent)

---

## Summary

| Module | New Test IDs | Count |
|---|---|---|
| Inbox — Groups | TC_GRP_001–013 | 13 |
| Inbox — Custom View | TC_CUV_001–007 | 7 |
| Inbox — Archive & Spam | TC_ARCH_001–005 | 5 |
| Inbox — Inbox Settings | TC_IST_001–007 | 7 |
| Boards — Add Ticket Form | TC_BRDTKT_001–007 | 7 |
| Boards — Upgrade / Plans Paywall | TC_UPG_001–009 | 9 |
| Contacts (new module) | TC_CONX_001–014 | 14 |
| Business Hours — Operating Hours | TC_OPH_001–012 | 12 |
| Workflows | TC_WKF_001–014 | 14 |
| Profile Menu | TC_PROF_001–011 | 11 |
| RBAC — New Agent Restrictions | TC_RAGENT_001–010 | 10 |
| Auth — Additional Login Scenarios | TC_AUTH2_001–010 | 10 |
| **TOTAL** | | **119** |

---

## 1. Inbox — Groups (`TC_GRP`)

> Admin can create Groups; agent cannot. Group creation modal = "Add Filter View" (same label as Custom View modal).

| ID | Scenario | Notes |
|---|---|---|
| TC_GRP_001 | Clicking "+ Add new" next to Groups opens "Add Filter View" modal | Admin only |
| TC_GRP_002 | Modal title reads "Add Filter View" (not "Add Group") | UI quirk worth asserting |
| TC_GRP_003 | Group Name field has red asterisk — is required | Validate empty submit |
| TC_GRP_004 | Upload Group Icon area shows "Upload logo, Max 10mb supported" | File upload zone |
| TC_GRP_005 | Ticket Assignment default is "Manual" (radio pre-selected) | Default state |
| TC_GRP_006 | Selecting "Circular" radio changes assignment mode | Rotation-based |
| TC_GRP_007 | Selecting "Balanced" radio changes assignment mode | Workload-based |
| TC_GRP_008 | Selecting "Random" radio changes assignment mode | Random |
| TC_GRP_009 | Info banner: "Ticket assignment is set to Manual by default" visible | Yellow info box |
| TC_GRP_010 | "Click here" in info banner links to Workflow Settings | Navigation |
| TC_GRP_011 | "Add members to group" dropdown shows team members | Dropdown select |
| TC_GRP_012 | Clicking Save with valid Group Name creates the group | Happy path |
| TC_GRP_013 | **RBAC**: Agent sees NO "+ Add new" button for Groups | Agent restriction |

---

## 2. Inbox — Custom View (`TC_CUV`)

> Admin only. Creates filtered inbox views with up to 11 filter dimensions.

| ID | Scenario | Notes |
|---|---|---|
| TC_CUV_001 | Clicking "+ Add new" next to Custom View opens "Add Filter View" modal | Admin only |
| TC_CUV_002 | View Name field has red asterisk — is required | Validate empty submit |
| TC_CUV_003 | Modal shows 11 filter options: Priority, Read Status, Tag, Team, Assigned, URL, Ticket Title, Mentioned, Created Date, Reply Status, Description | Full list |
| TC_CUV_004 | Priority filter activates a dropdown with options when checkbox clicked | Dropdown behaviour |
| TC_CUV_005 | Created Date filter shows a calendar date picker | Date picker control |
| TC_CUV_006 | "Create" button saves the custom view and it appears in sidebar | Happy path |
| TC_CUV_007 | **RBAC**: Agent sees NO "+ Add new" button for Custom View | Agent restriction |

---

## 3. Inbox — Archive & Spam (`TC_ARCH`)

> Accessible via "Archive & spam" sidebar link. URL: `/inbox/archived-spam`.

| ID | Scenario | Notes |
|---|---|---|
| TC_ARCH_001 | Clicking "Archive & spam" navigates to `/inbox/archived-spam` | URL assertion |
| TC_ARCH_002 | "Archive" tab is selected by default with count "Archive (0)" | Default tab |
| TC_ARCH_003 | Clicking "Spam" tab changes URL to `?tab=Spam` and title to "Spam (0)" | Tab navigation + URL |
| TC_ARCH_004 | Table columns present: Ticket ID & Details, Assignee, Customer Name, Type, Status, Tag, Created On | Column headers |
| TC_ARCH_005 | "No records found" shown when both tabs are empty | Empty state |

---

## 4. Inbox — Inbox Settings (`TC_IST`)

> Opens as a modal (not a page), from "Inbox Settings" at the bottom of the inbox sidebar.

| ID | Scenario | Notes |
|---|---|---|
| TC_IST_001 | Clicking "Inbox Settings" opens a modal (not a navigation) | Modal vs page |
| TC_IST_002 | Modal title: "Inbox Settings"; General section shows Name field pre-filled "Inbox" | Default state |
| TC_IST_003 | "Categories" dropdown shows "Inbox" as selected category | Default selection |
| TC_IST_004 | "Columns" section shows 4 default columns: Open, Archived, Snoozed, Closed | Default columns |
| TC_IST_005 | "+ Add column" button adds a new column to the inbox | Column creation |
| TC_IST_006 | Save button persists changes (name, category) | Save action |
| TC_IST_007 | **RBAC**: Agent does NOT see "Inbox Settings" link in sidebar | Agent restriction |

---

## 5. Boards — Add Ticket Form (`TC_BRDTKT`)

> The "+" icon on any board column opens a board-specific ticket creation modal.

| ID | Scenario | Notes |
|---|---|---|
| TC_BRDTKT_001 | Clicking "+" on the Open column of Bug board opens "Report a Bug" modal | Modal name changes per board |
| TC_BRDTKT_002 | "Board Column" field is pre-filled with the column name that was clicked | Smart pre-fill |
| TC_BRDTKT_003 | "Title" field has red asterisk — is required | Required validation |
| TC_BRDTKT_004 | "Description" is optional with placeholder "Briefly describe the issue..." | Optional field |
| TC_BRDTKT_005 | Attachments upload zone supports: JPG, PNG, SVG, MP4, MOV, WEBM, PDF | File type list |
| TC_BRDTKT_006 | "Select Assignee" dropdown shows "Choose a Team member" | Dropdown field |
| TC_BRDTKT_007 | "Create" button submits the ticket form | Happy path |

---

## 6. Boards — Upgrade / Plans Paywall (`TC_UPG`)

> Clicking the locked "Custom Boards" in the sidebar redirects to the Plans & Pricing upgrade modal.

| ID | Scenario | Notes |
|---|---|---|
| TC_UPG_001 | "Custom Boards" appears in boards sidebar with an orange lock icon | Lock icon visible |
| TC_UPG_002 | Clicking locked "Custom Boards" shows a "Plans & Pricing" modal | Upsell flow trigger |
| TC_UPG_003 | Modal shows 3 tiers: Starter (₹3,999/mo), Growth (₹9,999/mo), Pro (₹19,999/mo) | Pricing display |
| TC_UPG_004 | "Monthly" / "Yearly" toggle is present at the top of the pricing modal | Billing frequency toggle |
| TC_UPG_005 | Starter plan card shows "Current Plan" button (greyed out, not clickable) | Current plan state |
| TC_UPG_006 | Growth plan card shows "Start 14-Day Free Trial" CTA button | Upgrade CTA |
| TC_UPG_007 | Pro plan card shows "Start 14-Day Free Trial" CTA button | Upgrade CTA |
| TC_UPG_008 | Growth plan shows a "Most popular" gold badge | Badge visible |
| TC_UPG_009 | **RBAC**: Agent does NOT see "Custom Boards" entry at all (not even locked) | Agent restriction |

---

## 7. Contacts — New Module (`TC_CONX`)

> Contacts is workspace-level (URL: `/contacts`), NOT project-scoped. Direct project URL returns 404.

| ID | Scenario | Notes |
|---|---|---|
| TC_CONX_001 | Contacts page URL is `/contacts` (workspace-level, not `/project/ID/contacts`) | URL assertion |
| TC_CONX_002 | Navigating directly to `/project/ID/contacts` shows "Page not found" | 404 behaviour |
| TC_CONX_003 | Sidebar shows 5 filter categories: All, Users, Guests, Unsubscribed, Blocked | Category filters |
| TC_CONX_004 | "CUSTOM LISTS" section with "+ Create Custom List" link in sidebar | Custom list entry |
| TC_CONX_005 | Clicking "Import" opens "CSV Import" modal (supported format: CSV only) | CSV import modal |
| TC_CONX_006 | "+ Add Contact" opens modal with Name and Email fields | Add contact modal |
| TC_CONX_007 | "Merge contacts" button is visible on the contacts page | Merge action visible |
| TC_CONX_008 | Table columns: Name, Email, Last Activity, Settings gear | Column headers |
| TC_CONX_009 | Pagination shows "Showing 00–00 of 0 results" and "Items per page: 10" selector | Pagination controls |
| TC_CONX_010 | "Create Custom List" modal: List name* + filters (User type, Email Subscription, Last activity, Email domain/pattern) | Custom list form |
| TC_CONX_011 | Clicking "Users" filter tab shows "Users (0)" count | Tab switch |
| TC_CONX_012 | Clicking "Guests" filter tab shows "Guests (0)" count | Tab switch |
| TC_CONX_013 | Clicking "Unsubscribed" filter tab shows "Unsubscribed (0)" count | Tab switch |
| TC_CONX_014 | Clicking "Blocked" filter tab shows "Blocked (0)" count | Tab switch |

---

## 8. Business Hours — Operating Hours (`TC_OPH`)

> Page title: "Office Hours". Accessible only via sidebar (direct URL = 404).

| ID | Scenario | Notes |
|---|---|---|
| TC_OPH_001 | Operating Hours page accessible via Settings → Business Hours → Operating Hours | Navigation path |
| TC_OPH_002 | Direct URL navigation to `/settings/operatinghours` loads page (not 404) | URL works |
| TC_OPH_003 | "Availability Indicator" toggle is ON by default | Toggle state |
| TC_OPH_004 | Toggle label: "Show your online or offline status to users" | Label text |
| TC_OPH_005 | "Default Reply Time" shows a text field for custom message | Reply time field |
| TC_OPH_006 | Manage Operating Hours: timezone dropdown defaults to "Asia/Kolkata" | Default timezone |
| TC_OPH_007 | Day selector shows "Monday" as first entry | Default day |
| TC_OPH_008 | Time range defaults to 09:00 AM – 05:00 PM | Default hours |
| TC_OPH_009 | Delete (trash) icon removes a time entry | Delete action |
| TC_OPH_010 | Add icon (+) next to time range adds another time slot for same day | Multi-slot |
| TC_OPH_011 | "+ Add" button adds a new day row | Add day |
| TC_OPH_012 | "Outside Office Hours" text field for offline message | Offline message |
| TC_OPH_013 | Save button persists all changes | Save action |

---

## 9. Workflows (`TC_WKF`)

> Accessible via Settings → Workflows. Starter plan gets 10 workflows.

| ID | Scenario | Notes |
|---|---|---|
| TC_WKF_001 | Workflows page loads at `/settings/workflows` | URL works |
| TC_WKF_002 | Empty state shows "No workflows yet" heading | Empty state |
| TC_WKF_003 | Empty state subtitle: "Automate repetitive tasks by creating workflows that trigger actions based on specific events." | Subtitle text |
| TC_WKF_004 | "+ Create Workflow" button visible top-right | Button visible |
| TC_WKF_005 | Create Workflow modal has: Name* field, Description field, Trigger* section | Modal fields |
| TC_WKF_006 | **Ticket Events** trigger group has 10 options: Created, Status Changed, Priority Changed, Assigned, Unassigned, Closed, Reopened, Archived, Unarchived, Unmarked as Spam | All ticket triggers |
| TC_WKF_007 | **Message Events** group shows 3 options all tagged "Coming Soon" (Message Received, Customer Replied, Agent Sent Message) | Coming soon badge |
| TC_WKF_008 | **Tag Events** group has 2 options: Tag Added, Tag Removed | Tag triggers |
| TC_WKF_009 | **Feedback Events** group shows "Coming Soon" options (Satisfaction Rating, Feedback Submitted) | Coming soon |
| TC_WKF_010 | **Source Events** group: Ticket Created via Widget, via Email, Bug Report Received, Feature Request Received | Source triggers |
| TC_WKF_011 | **Custom Events** group shows "Custom Field Updated" tagged "Coming Soon" | Coming soon |
| TC_WKF_012 | Selecting a trigger and clicking "Create & Configure" opens the workflow builder | Workflow builder entry |
| TC_WKF_013 | Name field is required — submitting without it shows validation | Required field |
| TC_WKF_014 | Cancel button closes the modal without creating a workflow | Cancel action |

---

## 10. Profile Menu (`TC_PROF`)

> Opens from clicking the user avatar ("S") at the bottom-left of the left nav.

| ID | Scenario | Notes |
|---|---|---|
| TC_PROF_001 | Clicking user avatar opens profile popup menu | Popup trigger |
| TC_PROF_002 | Popup header shows user's full name and email address | User identity |
| TC_PROF_003 | "Availability" section is collapsible / expandable | Expand/collapse |
| TC_PROF_004 | "Theme" section is expandable (Light/Dark mode) | Theme toggle |
| TC_PROF_005 | "Workspaces" section shows workspace switcher | Workspace list |
| TC_PROF_006 | "Invite Members" link navigates to members settings | Navigation |
| TC_PROF_007 | "Billing" link navigates to billing/plans page | Navigation |
| TC_PROF_008 | "Documentation" item shows "Coming Soon" badge | Badge state |
| TC_PROF_009 | "Help Center" link is clickable and navigates | Navigation |
| TC_PROF_010 | "Logout" is displayed in red (danger colour) | Visual |
| TC_PROF_011 | Clicking Logout clears session and redirects to `/login` | Logout flow |

---

## 11. RBAC — Additional Agent Restrictions (`TC_RAGENT`)

> Extends existing TC_RBAC_007–012. All differences confirmed by logging in as `atstarterus@mailinator.com`.

| ID | Scenario | Agent Behaviour | Admin Behaviour |
|---|---|---|---|
| TC_RAGENT_001 | Groups section in inbox sidebar | NO "+ Add new" button | "+ Add new" button visible |
| TC_RAGENT_002 | Custom View section in inbox sidebar | NO "+ Add new" button | "+ Add new" button visible |
| TC_RAGENT_003 | Inbox Settings link in sidebar | NOT visible | Visible at bottom |
| TC_RAGENT_004 | Settings gear icon in left nav (bottom) | NOT visible | Visible |
| TC_RAGENT_005 | Settings page access | Inaccessible (no nav entry) | Full access |
| TC_RAGENT_006 | Boards top-right toolbar icons | Search, Sort, Filter only (3 icons) | Search, Sort, Filter, Settings (4 icons) |
| TC_RAGENT_007 | "Custom Boards" entry in boards sidebar | NOT visible | Visible (locked with icon) |
| TC_RAGENT_008 | Agent CAN view Bug board | ✅ Bug board loads | Same |
| TC_RAGENT_009 | Agent CAN view FeatureRequests board | ✅ FeatureRequests loads | Same |
| TC_RAGENT_010 | Agent CAN add tickets via "+" on board columns | ✅ "+" icon present | Same |

---

## 12. Auth — Additional Login Scenarios (`TC_AUTH2`)

> Extends existing TC_AUTH tests. The login flow is **2-step** (email → then password).

| ID | Scenario | Notes |
|---|---|---|
| TC_AUTH2_001 | Login page shows "Sign in with Google" button (OAuth option) | Google SSO |
| TC_AUTH2_002 | Login flow is 2-step: enter email → click Sign In → password field appears | Step-by-step |
| TC_AUTH2_003 | After email step, URL contains `?email=<encoded_email>` param | URL param |
| TC_AUTH2_004 | Password field has show/hide toggle eye icon | Password reveal |
| TC_AUTH2_005 | "Remember me" checkbox available on password step | Persistent login |
| TC_AUTH2_006 | "Forgot your password?" link visible on password step | Password recovery |
| TC_AUTH2_007 | "Back to Login" link on password step returns to email entry | Back navigation |
| TC_AUTH2_008 | "Don't remember your password? Send me a code" OTP magic link option | Passwordless login |
| TC_AUTH2_009 | Login page left panel is an animated carousel with 3 slides | Carousel present |
| TC_AUTH2_010 | Language selector (English dropdown) shown top-right of login page | i18n toggle |

---

## How to Implement

### Priority Order (implement in this sequence)

1. **High** — RBAC agent restrictions (`TC_RAGENT`) — blocks when agents get wrong access
2. **High** — Archive & Spam (`TC_ARCH`) — regression risk, core inbox feature
3. **High** — Auth additions (`TC_AUTH2`) — login flow coverage gaps
4. **Medium** — Contacts module (`TC_CONX`) — completely untested module
5. **Medium** — Profile menu (`TC_PROF`) — logout flow untested
6. **Medium** — Add Ticket form (`TC_BRDTKT`) — ticket creation uncovered
7. **Medium** — Groups / Custom View / Inbox Settings (`TC_GRP`, `TC_CUV`, `TC_IST`)
8. **Lower** — Upgrade/Paywall flow (`TC_UPG`) — use `test.fail()` for paid CTAs
9. **Lower** — Workflows (`TC_WKF`) — complex, needs dedicated spec file
10. **Lower** — Business Hours (`TC_OPH`) — settings page, low regression risk

### Suggested New Spec Files

```
src/modules/starter/
  inbox/tests/
    inbox-groups.spec.ts         # TC_GRP_001–013
    inbox-custom-view.spec.ts    # TC_CUV_001–007
    inbox-archive-spam.spec.ts   # TC_ARCH_001–005
    inbox-settings.spec.ts       # TC_IST_001–007
  boards/tests/
    boards-add-ticket.spec.ts    # TC_BRDTKT_001–007
    boards-upgrade-flow.spec.ts  # TC_UPG_001–009
  contacts/tests/
    contacts-smoke.spec.ts       # TC_CONX_001–014
  workflows/tests/
    workflows-smoke.spec.ts      # TC_WKF_001–014
  profile/tests/
    profile-menu.spec.ts         # TC_PROF_001–011
  rbac/tests/
    rbac-agent-extended.spec.ts  # TC_RAGENT_001–010 (extends existing)
  auth/tests/
    auth-login-extended.spec.ts  # TC_AUTH2_001–010 (extends existing)
  business-hours/tests/
    operating-hours.spec.ts      # TC_OPH_001–013
```
