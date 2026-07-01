# Bublly Playwright V3 — Complete Framework Guide

> Everything you need to understand this framework from scratch.  
> Read top to bottom once, then use as a reference anytime.

---

## Table of Contents

1. [What Is This Framework?](#1-what-is-this-framework)
2. [Project Structure](#2-project-structure)
3. [Execution Order — The Big Picture](#3-execution-order--the-big-picture)
4. [Layer 1 — package.json](#4-layer-1--packagejson)
5. [Layer 2 — playwright.config.ts](#5-layer-2--playwrightconfigts)
6. [Layer 3 — config/environment.ts](#6-layer-3--configenvironmentts)
7. [Layer 4 — config/personas.ts](#7-layer-4--configpersonasts)
8. [Layer 5 — global-setup.ts](#8-layer-5--global-setupts)
9. [Layer 6 — core/constants/timeouts.ts](#9-layer-6--coreconstantstimeoutsts)
10. [Layer 7 — core/fixtures/base.fixture.ts](#10-layer-7--corefixturesbasefixturets)
11. [Layer 8 — Role Fixtures](#11-layer-8--role-fixtures)
12. [Layer 9 — Module Layer (3-File Pattern)](#12-layer-9--module-layer-3-file-pattern)
13. [Layer 10 — Test Files](#13-layer-10--test-files)
14. [RBAC Testing — How Roles Are Tested](#14-rbac-testing--how-roles-are-tested)
15. [Auth Flow — How Login Works](#15-auth-flow--how-login-works)
16. [Flaky Test RCA & Fix Guide](#16-flaky-test-rca--fix-guide)
17. [Running Tests — All Commands](#17-running-tests--all-commands)
18. [Test Count & Module Breakdown](#18-test-count--module-breakdown)
19. [Key Design Decisions](#19-key-design-decisions)
20. [Glossary](#20-glossary)

---

## 1. What Is This Framework?

This is a **Playwright + TypeScript** end-to-end test automation framework for [Bublly](https://qa-desk.bublly.com) — a helpdesk SaaS application.

**What it tests:**
- Free plan user (atfree@mailinator.com) — Auth, Inbox, Boards, Contacts, Dashboard, Widget
- Starter plan admin (atstarter@mailinator.com) — Settings, RBAC
- Starter plan agent (atstarterus@mailinator.com) — RBAC role restrictions

**Core principle:**  
Each file has one job. Credentials → Config → Auth → Fixture → Page → Locator → Test.  
Change one thing in one place. Nothing else breaks.

---

## 2. Project Structure

```
bublly-playwright-v3/
│
├── .env.qa                          ← credentials (GITIGNORED — never committed)
├── .auth/                           ← saved login files (GITIGNORED)
│   ├── free-user.json
│   ├── starter-admin.json
│   └── starter-agent.json
│
├── playwright.config.ts             ← master config — entry point
├── package.json                     ← scripts and dependencies
│
├── config/
│   ├── environment.ts               ← reads .env.qa, exports typed `env` object
│   └── personas.ts                  ← maps role name → auth file path
│
├── src/
│   ├── core/
│   │   ├── constants/
│   │   │   └── timeouts.ts          ← all timeout values in one place
│   │   ├── fixtures/
│   │   │   ├── base.fixture.ts      ← injects auth into every test's browser
│   │   │   ├── starter-base.fixture.ts  ← sets persona = starterAdmin
│   │   │   └── agent-base.fixture.ts    ← sets persona = starterAgent
│   │   └── setup/
│   │       └── global-setup.ts      ← logs in all accounts once before tests
│   │
│   └── modules/
│       ├── auth/
│       │   ├── locators/auth.locators.ts
│       │   ├── pages/auth.page.ts
│       │   ├── fixtures/auth.fixture.ts
│       │   └── tests/
│       ├── inbox/                   ← same 4-folder structure
│       ├── boards/
│       ├── contacts/
│       ├── dashboard/
│       ├── widget/
│       └── starter/
│           ├── settings/            ← admin-only settings tests
│           └── rbac/                ← role difference tests
│
└── scripts/
    ├── seed-fixtures.ts             ← creates test data in QA
    └── cleanup-stale.ts             ← removes old test data
```

---

## 3. Execution Order — The Big Picture

When you run `npx playwright test`, this is exactly what happens:

```
Step 1: playwright.config.ts
        Reads config. Finds all *.spec.ts files under src/.
        Sets baseURL, workers, retries, reporter.

Step 2: global-setup.ts  (runs ONCE before any test)
        Logs in free user    → saves .auth/free-user.json
        Logs in admin        → saves .auth/starter-admin.json
        Logs in agent        → saves .auth/starter-agent.json
        Warms up widget server

Step 3: [For each test]
        base.fixture.ts
          Reads .auth/free-user.json (or other persona)
          Creates browser context with saved cookies
          Injects sessionStorage (JWT token) via addInitScript

Step 4: Module fixture (e.g. inbox.fixture.ts)
          Creates InboxPage(page)
          Passes it to the test

Step 5: Test runs
          Calls page object methods (inboxPage.goto())
          Makes assertions (expect(count).toBeGreaterThanOrEqual(1))

Step 6: Cleanup
          ctx.close() — browser context destroyed
          Next test starts from Step 3

Step 7: After all 338 tests
          HTML report generated → playwright-report/
          Allure report generated → allure-results/
```

---

## 4. Layer 1 — `package.json`

```json
{
  "scripts": {
    "test":            "playwright test",
    "test:headed":     "playwright test --headed",
    "test:debug":      "playwright test --debug",
    "test:ui":         "playwright test --ui",
    "test:smoke":      "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:inbox":      "playwright test src/modules/inbox",
    "test:boards":     "playwright test src/modules/boards"
  }
}
```

| Script | What it does |
|---|---|
| `npm test` | Run all 338 tests headlessly |
| `test:headed` | Open a real visible browser — watch tests run |
| `test:debug` | Pause at every step — step through manually |
| `test:ui` | Visual Playwright UI — click and run individual tests |
| `test:smoke` | Only tests tagged `@smoke` |
| `test:inbox` | Only inbox module tests |

**Key dependencies:**
- `@playwright/test` — browser automation + test runner
- `dotenv` — reads `.env.qa` into `process.env`
- `typescript` + `ts-node` — TypeScript support
- `allure-playwright` — visual HTML reports

---

## 5. Layer 2 — `playwright.config.ts`

```ts
export default defineConfig({
  testDir: './src',           // scan src/ for *.spec.ts files
  fullyParallel: true,        // run all tests at the same time
  forbidOnly: !!process.env.CI, // fail CI if test.only() is committed
  retries: 1,                 // retry failed test once (handles QA flakiness)
  workers: 1,                 // 1 browser at a time (QA server limitation)

  expect: { timeout: 20_000 }, // every expect() waits up to 20s

  reporter: [
    ['html',             { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],            // live terminal output during run
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],

  use: {
    baseURL: 'https://qa-desk.bublly.com',  // page.goto('/dashboard') → full URL
    storageState: '.auth/free-user.json',   // default auth = free user
    trace: 'on-first-retry',               // record trace when test retries
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,                 // click/fill timeout
    navigationTimeout: 30_000,            // page.goto() timeout
    ignoreHTTPSErrors: true,              // QA uses self-signed SSL certs
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  globalSetup: './src/core/setup/global-setup.ts',  // runs FIRST before tests
});
```

**Line-by-line explanations:**

| Line | Why it exists |
|---|---|
| `fullyParallel: true` | Without this, tests run one by one — very slow |
| `forbidOnly` | Prevents `test.only()` from being committed accidentally |
| `retries: 1` | QA server is slow/flaky — auto-retry prevents false failures |
| `workers: 1` | Multiple browsers overwhelm the QA widget queue |
| `baseURL` | You write `'/dashboard'` in tests — config adds the domain |
| `storageState` | Default auth — every test starts logged in as free user |
| `trace: 'on-first-retry'` | Record every action for debugging when a test retries |
| `ignoreHTTPSErrors` | QA help center has self-signed cert — browser rejects it otherwise |
| `globalSetup` | The login script — runs once, all tests reuse saved auth files |

---

## 6. Layer 3 — `config/environment.ts`

```ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.qa' });

// Throws if a required variable is missing from .env.qa
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`.env.qa is missing required variable: ${key}`);
  return value;
};

export const env = {
  baseUrl:    process.env.BASE_URL     ?? 'https://qa-desk.bublly.com',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://api-qa-desk.bublly.com',

  freeUser: {
    email:    required('FREE_USER_EMAIL'),  // throws if missing
    password: required('FREE_USER_PASS'),
  },
  starterUser: {
    email:    process.env.STARTER_USER_EMAIL ?? '',  // optional
    password: process.env.STARTER_USER_PASS  ?? '',
  },
  starterAgent: {
    email:    process.env.STARTER_AGENT_EMAIL ?? '',
    password: process.env.STARTER_AGENT_PASS  ?? '',
  },
  workspace: {
    projectId: required('QA_PROJECT_ID'),
    inboxId:   required('QA_INBOX_ID'),
  },
};
```

**Why this file exists:**  
No other file ever reads `process.env` directly. Everything goes through `env`. If a variable name changes in `.env.qa`, you fix it in one place here.

**`required()` vs `?? ''`:**
- `required()` — throws immediately if missing. Used for critical variables without which nothing works.
- `?? ''` — returns empty string if missing. Used for optional variables (starter accounts).

---

## 7. Layer 4 — `config/personas.ts`

```ts
export const PERSONAS = {
  freeUser: {
    authFile: '.auth/free-user.json',
    email:    env.freeUser.email,
  },
  starterAdmin: {
    authFile: '.auth/starter-admin.json',
    email:    env.starterUser.email,
  },
  starterAgent: {
    authFile: '.auth/starter-agent.json',
    email:    env.starterAgent.email,
  },
} as const;
```

**What it does:**  
Maps a role name → the file where that role's saved login is stored.

**`as const`:**  
Makes all values readonly at the TypeScript level. Prevents accidental reassignment.

**Where it's used:**  
`base.fixture.ts` reads `PERSONAS[persona].authFile` to know which file to load for each test.

---

## 8. Layer 5 — `global-setup.ts`

This file runs **once** before the entire test suite. Its job: log in all accounts and save their auth to files.

```ts
const MAX_TOKEN_AGE_MS = 20 * 60 * 1000;  // 20 minutes

export default async function globalSetup() {
  await ensureAuth('.auth/free-user.json',      freeUser.email,     freeUser.pass);
  await ensureAuth('.auth/starter-admin.json',  starterUser.email,  starterUser.pass);
  await ensureAuth('.auth/starter-agent.json',  starterAgent.email, starterAgent.pass);
  await warmupWidgetServer();
}
```

### `ensureAuth()` — the smart login function

```
1. Is there an auth file?
   NO  → login now
   YES → is it less than 20 minutes old?
         NO  → login now
         YES → is the token still valid? (real API call to check)
               NO  → login now
               YES → skip login (reuse existing auth)
```

This saves 30 seconds per account on repeated runs.

### The two-step login

```ts
async function doLogin(page, email, password) {
  await page.goto(`${env.baseUrl}/login`);

  // Step 1: enter email
  await page.getByRole('textbox', { name: 'Work Email*' }).fill(email);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Step 2: enter password (app shows password screen after email)
  await page.getByRole('textbox', { name: 'Password*' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}
```

### What gets saved after login

```ts
// Cookies — normal browser session
const state = await page.context().storageState();

// sessionStorage — where Bublly stores the JWT token
const ssData = await page.evaluate(
  () => Object.fromEntries(Object.entries(sessionStorage))
);

// Save both together in one file
fs.writeFileSync(authFile, JSON.stringify({ ...state, sessionStorageData: ssData }));
```

**Why sessionStorage?**  
Bublly stores the JWT auth token in `sessionStorage`, not cookies. Playwright's built-in `storageState` only saves cookies and localStorage. Without capturing `sessionStorage` separately, the browser would load without the token and redirect to login.

### Token validation

```ts
async function validateTokenFromFile(filePath) {
  const auth = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const { accessToken } = JSON.parse(auth.sessionStorageData.userKey);

  const res = await fetch(`${env.apiBaseUrl}/users/getUser`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.status === 200;  // 200 = valid, 401 = expired
}
```

Makes a real API call to Bublly's server to verify the token is still alive before trusting it.

---

## 9. Layer 6 — `core/constants/timeouts.ts`

```ts
export const TIMEOUTS = {
  element:    10_000,   // wait for a button/input to appear
  navigation: 45_000,   // wait for page.goto() to complete
  action:     15_000,   // wait for a click to take effect
  slow:       90_000,   // slow operations (status changes, API calls)
  aiResponse: 30_000,   // wait for AI to generate a response
} as const;
```

**Why one file for timeouts?**  
If the QA server gets permanently slower, you change one number here and all 338 tests automatically get the new timeout. Without this file, you'd update timeouts in 50+ files.

---

## 10. Layer 7 — `core/fixtures/base.fixture.ts`

This is the **heart of the framework**. Every test gets its authenticated `page` from here.

```ts
export const test = base.extend<Fixtures>({

  // Default persona — can be overridden by role fixtures
  persona: ['freeUser', { option: true }],

  // Override Playwright's built-in `page` fixture
  page: async ({ browser, persona }, use) => {

    // 1. Find the right auth file
    const authFilePath = PERSONAS[persona].authFile;
    const authFile = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));

    // 2. Create a browser context with saved cookies
    const ctx = await browser.newContext({
      storageState: {
        cookies: authFile.cookies ?? [],
        origins: authFile.origins ?? [],
      },
    });

    const page = await ctx.newPage();

    // 3. Inject sessionStorage BEFORE every page load
    await page.addInitScript((ss) => {
      Object.entries(ss).forEach(([k, v]) => sessionStorage.setItem(k, v));
    }, authFile.sessionStorageData ?? {});

    // 4. Mid-run recovery: if QA server redirects to /login, re-inject token
    page.on('framenavigated', frame => {
      if (frame !== page.mainFrame()) return;
      if (frame.url().includes('/login')) {
        const latest = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
        page.evaluate((data) => {
          Object.entries(data).forEach(([k, v]) => sessionStorage.setItem(k, v));
        }, latest.sessionStorageData ?? {}).catch(() => {});
      }
    });

    // 5. Hand the ready page to the test
    await use(page);

    // 6. Cleanup when test finishes
    await ctx.close();
  },
});
```

### Key concepts

**`base.extend()`** — Playwright's way of creating a custom test object with extra fixtures. Every test that imports from this file gets the authenticated page automatically.

**`addInitScript`** — Registers a script that runs inside the browser before every page navigation. This is how the JWT token gets injected without logging in every test.

**`framenavigated` event** — Fires whenever the browser navigates to a new URL. If the QA server restarts mid-run and invalidates the session, the browser gets redirected to `/login`. This listener catches that and re-injects the token immediately.

**`await use(page)`** — The fixture pattern. Everything before `use()` = setup. Everything after `use()` = teardown.

---

## 11. Layer 8 — Role Fixtures

### `starter-base.fixture.ts` — Admin role

```ts
import { test as base, expect } from './base.fixture';

export const test = base.extend<{ persona: string }>({
  persona: async ({}, use) => { await use('starterAdmin'); },
});

export { expect };
```

Any test that imports from this file gets a browser logged in as `atstarter@mailinator.com` (admin).

### `agent-base.fixture.ts` — Agent role

```ts
import { test as base, expect } from './base.fixture';

export const test = base.extend<{ persona: string }>({
  persona: async ({}, use) => { await use('starterAgent'); },
});

export { expect };
```

Any test that imports from this file gets a browser logged in as `atstarterus@mailinator.com` (agent).

### Why just one word difference matters

```
starter-base.fixture.ts → persona = 'starterAdmin' → .auth/starter-admin.json → admin browser
agent-base.fixture.ts   → persona = 'starterAgent' → .auth/starter-agent.json → agent browser
```

The test code is identical. Only the fixture import changes. That one import determines which person the browser is logged in as.

---

## 12. Layer 9 — Module Layer (3-File Pattern)

Every module has exactly 3 files. Using **Inbox** as the example:

### File 1: `locators/inbox.locators.ts` — WHERE things are

```ts
export function inboxLocators(page: Page) {
  return {
    // Conversation list rows — unique CSS class combination
    conversationItems: page.locator('[class~="group"][class*="receiver-bg"]'),

    // New conversation button — uses stable ID
    newConversationBtn: page.locator('#tour-step-new-conversation'),

    // ProseMirror editor — NOT a real input, target by ARIA role
    messageInput: page.locator('[role="textbox"][aria-multiline="true"]').first(),

    // Status dropdown — filter to the one showing ticket count (2+ digits)
    statusDropdown: page.getByRole('combobox').filter({ hasText: /\d{2,}/ }).first(),

    // Snooze button — scoped to detail header to avoid false matches
    snoozeBtn: detailHeaderBar.locator('div[class*="rounded-full"]').nth(0),
  };
}
```

**Rules for locators:**
- One file, only selectors. No actions, no assertions.
- Prefer `id` > `aria role` > `text` > `CSS class` (order of stability)
- Add comments explaining WHY a selector is written the way it is
- Scope locators to avoid false matches from other parts of the page

### File 2: `pages/inbox.page.ts` — WHAT you can do

```ts
export class InboxPage {
  private loc = inboxLocators(page);

  // Navigate to inbox — handles slow QA server with two-attempt pattern
  async goto(): Promise<void> {
    try {
      await this.page.goto(url, { timeout: 30_000 });
    } catch {
      await this.page.goto(url, { timeout: 60_000 });  // second attempt
    }
    // Wait for EITHER content or empty state — both are valid
    await Promise.race([
      this.loc.conversationItems.first().waitFor({ state: 'visible', timeout: 15_000 }),
      this.page.getByText('Inbox zero').waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {});
  }

  // Apply a filter — navigate by URL (more reliable than clicking dropdown)
  async applyFilter(filter: 'open' | 'closed' | 'snoozed' | 'archived'): Promise<void> {
    await this.page.goto(`/inbox/.../all/${filter}`);
  }

  // Search — click trigger first, then fill input
  async search(query: string): Promise<void> {
    await this.loc.searchTrigger.click();
    await this.loc.searchInput.fill(query);
    await this.loc.searchInput.press('Enter');
  }
}
```

**Rules for page objects:**
- One file, only actions (goto, click, fill, navigate). No assertions.
- Every method waits for the result before returning
- Use `Promise.race` when a page has multiple valid final states
- Use URL navigation instead of clicking when clicks are unreliable

### File 3: `fixtures/inbox.fixture.ts` — connects page to test

```ts
export const test = base.extend<{ inboxPage: InboxPage }>({
  inboxPage: async ({ page }, use) => {
    await use(new InboxPage(page));
  },
});
```

One job: create the page object and give it to the test.

### Why 3 files per module?

| If this changes... | You fix this file only | No other files break |
|---|---|---|
| HTML selector (class, id, aria) | `locators.ts` | ✅ |
| App flow (new step, URL changed) | `page.ts` | ✅ |
| What to assert | `spec.ts` | ✅ |

Without this separation, one HTML change would require updating 20+ test files.

---

## 13. Layer 10 — Test Files

```ts
import { test, expect } from '../fixtures/inbox.fixture';

test.describe('Inbox smoke — TC_INB_001–015 @smoke', () => {
  test.setTimeout(90_000);  // all tests in this block get 90s

  test('TC_INB_001 inbox page loads and shows conversations', async ({ inboxPage }) => {
    await inboxPage.goto();
    const count = await inboxPage.getConversationCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // Documents a known bug — test is expected to fail
  // Remove test.fail() when the bug is fixed in QA
  test.fail('TC_INB_011 no-match search shows empty state', async ({ inboxPage }) => {
    await inboxPage.search('zzz_no_match_xyz_12345');
    const count = await inboxPage.getConversationCount();
    expect(count).toBe(0);  // currently returns 11 — QA bug
  });
});
```

**Rules for test files:**
- Import from the module fixture — never from base.fixture directly
- No `page.locator()` in tests — use page object methods only
- Test names follow: `TC_XXX_NNN description` format
- Add `@smoke` or `@regression` tags to the describe block
- Use `test.fail()` to document known bugs — keeps CI green

---

## 14. RBAC Testing — How Roles Are Tested

RBAC = Role-Based Access Control. Tests prove that admins CAN and agents CANNOT access certain features.

### The exploration process

Before writing any test:
1. Log in as **admin** → navigate every module → note what's accessible
2. Log in as **agent** → navigate every module → note what's restricted
3. Write tests that **assert the differences**

### Admin vs Agent differences

| Feature | Admin | Agent |
|---|---|---|
| Settings gear icon | Visible | Hidden (CSS) |
| Settings URL `/settings` | Opens settings home | Redirects / page not found |
| Contacts — Merge button | Visible | Not present |
| Contacts — Create Custom List | Unlocked (+ icon) | Locked (lock icon) |
| Post-login landing | Dashboard | Inbox |
| Boards | Full access | Full access |
| Inbox | Full access | Full access |

### Code — how the role switch works

```
rbac-admin.spec.ts
  imports starter-base.fixture.ts
    overrides persona = 'starterAdmin'
      base.fixture.ts loads .auth/starter-admin.json
        browser = atstarter@mailinator.com (ADMIN)

rbac-agent.spec.ts
  imports agent-base.fixture.ts
    overrides persona = 'starterAgent'
      base.fixture.ts loads .auth/starter-agent.json
        browser = atstarterus@mailinator.com (AGENT)
```

### Example — same test, opposite assertion

```ts
// rbac-admin.spec.ts — admin SEES the gear icon
test('TC_RBAC_002 admin sidebar shows Settings gear icon', async ({ page }) => {
  await page.goto('/dashboard');
  const settingsIcon = page.locator('[id*="settings"]').first();
  await expect(settingsIcon).toBeVisible();       // ✅ visible for admin
});

// rbac-agent.spec.ts — agent does NOT see the gear icon
test('TC_RBAC_008 agent sidebar Settings gear icon is not visible', async ({ page }) => {
  await page.goto('/dashboard');
  const settingsIcon = page.locator('[id*="settings"]').first();
  await expect(settingsIcon).not.toBeVisible();   // ✅ hidden for agent
});
```

Same locator. Same URL. Opposite assertion. Different result because different auth was injected.

---

## 15. Auth Flow — How Login Works

### The complete auth chain

```
.env.qa
  FREE_USER_EMAIL=atfree@mailinator.com
  STARTER_USER_EMAIL=atstarter@mailinator.com
  STARTER_AGENT_EMAIL=atstarterus@mailinator.com
        ↓
environment.ts
  env.freeUser.email = 'atfree@mailinator.com'
        ↓
global-setup.ts  (runs ONCE before all tests)
  doLogin(freeUser)    → .auth/free-user.json
  doLogin(starterUser) → .auth/starter-admin.json
  doLogin(starterAgent)→ .auth/starter-agent.json
        ↓
personas.ts
  freeUser     → .auth/free-user.json
  starterAdmin → .auth/starter-admin.json
  starterAgent → .auth/starter-agent.json
        ↓
base.fixture.ts  (runs for EVERY test)
  reads .auth/free-user.json (or other persona)
  newContext({ storageState: { cookies } })   ← injects cookies
  addInitScript → sessionStorage.setItem(jwt) ← injects JWT token
        ↓
Test runs with authenticated page — no login needed in any test
```

### Why cookies AND sessionStorage?

| Storage | Contains | Captured by |
|---|---|---|
| Cookies | Session cookie | `page.context().storageState()` |
| sessionStorage | JWT access token | `page.evaluate(() => sessionStorage)` |

Bublly uses sessionStorage for the JWT. Without capturing it separately, the browser has cookies but no token — still gets redirected to login.

### Why `addInitScript` instead of just cookies?

Cookies persist across navigations automatically. But `sessionStorage` is **cleared when the browser context is created fresh**. `addInitScript` re-injects it before every page load, so even after a redirect or refresh the JWT is always there.

---

## 16. Flaky Test RCA & Fix Guide

### What is a flaky test?

A test that sometimes passes, sometimes fails — for the same code. Usually caused by timing: the test checks something before it's ready.

### TC_BRD_005 — Fixed ✅

**Test:** "FeatureRequests board link is visible in sidebar"

**Root cause:**
```
goto()
  ↓
waits for "Open" column (board content)  ← API Call 1, fast (~2s)
  ↓
returns ✅
  ↓
test checks featureBoardLink             ← API Call 2 (sidebar) still loading ❌
```

**Fix applied:**
```ts
async goto(boardId): Promise<void> {
  await this.page.goto(url);
  // Wait for BOTH board content AND sidebar simultaneously
  await Promise.all([
    this.loc.openColumnLabel.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
    this.loc.bugBoardLink.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation }),
  ]);
}
```

**Why `Promise.all` not sequential?**
- Sequential: 2s + 6s = 8s total
- Parallel: both start together, resolves when slowest finishes = 6s

### TC_CON_007 — Pending Fix ⚠️

**Test:** "clicking Users tab changes URL to ?type=user"

**Root cause:**
```
clickSidebarUsers()
  ↓
waitForTimeout(800)   ← fixed 800ms — not enough on slow QA server
  ↓
expect(url).toContain('type=user')  ← URL hasn't updated yet ❌
```

**Fix:** Replace `waitForTimeout(800)` with `page.waitForURL(/type=user/)`.

### General RCA pattern

When a test is flaky, ask:
1. What does the test check immediately after a click/navigation?
2. Is that thing loaded by a **separate API call** from the main content?
3. Does `goto()` or the action method wait for **all** critical content?

### Fix pattern

```
❌ Bad: waitForTimeout(800)                     — guessing a time
✅ Good: element.waitFor({ state: 'visible' })  — wait for actual condition
✅ Good: page.waitForURL(/pattern/)             — wait for URL to actually change
✅ Good: Promise.all([wait1, wait2])            — wait for all critical elements
```

---

## 17. Running Tests — All Commands

```bash
# Run everything
npx playwright test

# Run with visible browser window
npx playwright test --headed

# Step through each line manually
npx playwright test --debug

# Open visual Playwright UI
npx playwright test --ui

# Run one module only
npx playwright test src/modules/inbox
npx playwright test src/modules/boards
npx playwright test src/modules/auth
npx playwright test src/modules/contacts

# Run by tag
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @rbac
npx playwright test --grep @settings

# Run one specific test
npx playwright test --grep "TC_INB_001"

# Run one test file
npx playwright test src/modules/inbox/tests/inbox-smoke.spec.ts

# Run a test N times to verify it's not flaky
npx playwright test --grep "TC_BRD_005" --repeat-each 5

# View HTML report after run
npx playwright show-report

# Generate and open Allure report
npm run allure:report
```

---

## 18. Test Count & Module Breakdown

| Module | Tests | Persona | Location |
|---|---|---|---|
| Auth | 50 | freeUser | `src/modules/auth/tests/` |
| Inbox | 68 | freeUser | `src/modules/inbox/tests/` |
| Boards | 55 | freeUser | `src/modules/boards/tests/` |
| Contacts | ~30 | freeUser | `src/modules/contacts/tests/` |
| Dashboard | ~50 | freeUser | `src/modules/dashboard/tests/` |
| Widget | 5 | freeUser | `src/modules/widget/tests/` |
| Settings | 46 | starterAdmin | `src/modules/starter/settings/tests/` |
| RBAC | 12 | starterAdmin + starterAgent | `src/modules/starter/rbac/tests/` |
| E2E Flows | 4 | freeUser | `src/e2e/tests/` |
| **Total** | **338** | | |

### Latest run result

```
337 passed
  1 flaky — TC_CON_007 (contacts URL timing — fix pending)
Time: ~23-25 minutes
```

---

## 19. Key Design Decisions

### Why session-based auth instead of login in every test?

Login takes 15-20 seconds per test. With 338 tests = 94 minutes of login time.  
Session-based auth: login once per run (~45 seconds total for 3 accounts). Tests reuse saved auth.

### Why `workers: 1` instead of parallel browsers?

The QA widget server can't handle multiple simultaneous browser connections — tickets stop routing.  
Running one browser at a time (serial) eliminates this problem entirely.

### Why `Promise.all` in `goto()` methods?

Many pages load content from multiple API calls independently. If `goto()` only waits for the first visible element, subsequent elements from slower API calls may not be ready. `Promise.all` ensures ALL critical content is loaded before returning.

### Why navigate by URL instead of clicking for filters?

The status dropdown in inbox is unreliable in QA — it can trigger client-side crashes.  
URL navigation bypasses the UI entirely and is always reliable.

### Why `test.fail()` for known bugs?

Without it: the test fails in CI, the team thinks something broke, investigation wastes time.  
With it: CI stays green, the bug is documented in code, and the test will automatically start passing when the bug is fixed (remove `test.fail()` then).

### Why `addInitScript` instead of intercepting network calls?

Network interception would require mocking the auth API — creating fake tokens that diverge from real server behavior.  
`addInitScript` uses the real token from a real login — no mocking, no divergence.

---

## 20. Glossary

| Term | Meaning |
|---|---|
| **Fixture** | A reusable piece of setup injected into tests automatically |
| **Persona** | The role/account the browser is logged in as |
| **sessionStorage** | Browser storage cleared on tab close — where Bublly stores the JWT |
| **JWT** | JSON Web Token — the auth token that proves you're logged in |
| **addInitScript** | Playwright method — runs inside the browser before every page load |
| **globalSetup** | File that runs once before all tests — used for login |
| **storageState** | Playwright's saved browser state (cookies + localStorage) |
| **Promise.all** | Wait for multiple async operations to ALL finish |
| **Promise.race** | Wait for the FIRST of multiple async operations to finish |
| **Locator** | A lazy reference to a DOM element — doesn't search until you interact |
| **Page Object** | A class that wraps all actions for one page/module |
| **RBAC** | Role-Based Access Control — different users see different features |
| **Flaky test** | A test that sometimes passes and sometimes fails for the same code |
| **@smoke** | Tag for fast, critical-path tests — run after every deployment |
| **@regression** | Tag for thorough tests — run before releases |
| **workers** | Number of browser instances running simultaneously |
| **retries** | How many times to retry a failing test before marking it failed |
| **baseURL** | The domain prefix — `page.goto('/dashboard')` becomes the full URL |
| **RCA** | Root Cause Analysis — finding WHY something failed, not just WHAT |
| **`as const`** | TypeScript keyword — makes all values readonly |
| **`??`** | Nullish coalescing — use right side if left side is null/undefined |

---

*Last updated: June 2026*  
*Framework: Playwright v1.45 + TypeScript v5.4*  
*Total tests: 338 across 3 personas*
