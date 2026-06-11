# Bublly Playwright v3 — Framework Guide

## Quick start

```bash
# First time only
npm install
npx playwright install chromium
cp .env.qa.example .env.qa   # fill in credentials
npm run seed                  # borrow fixture tickets from QA pool (once per env reset)

# Run smoke suite
npm run test:smoke

# Run all auth tests
npm run test:auth

# Run all inbox tests
npm run test:inbox

# Open HTML report
npm run report
```

## Auth setup

The framework generates a custom auth file at `.auth/free-user.json` on first run via `globalSetup`. It captures both cookies AND sessionStorage (Playwright's built-in storageState misses sessionStorage, which is where Bublly stores its auth token). Each test gets a fresh `BrowserContext` restored from this file.

**If tests start failing with redirect-to-login errors:**
```bash
bash scripts/refresh-auth.sh
```

## How seeding works

Bublly inbox tickets come from live customer widget sessions — they cannot be created via agent API. The `scripts/seed-fixtures.ts` borrows 5 existing open tickets from the QA pool and sets their statuses (open/snoozed/closed/archived/assigned). IDs are stored in `.fixtures/fixture-data.json`.

Smoke tests are read-only and navigate to these tickets by ID — they never mutate fixture data.

## Writing a new test

### Import from the module fixture

```typescript
// ✅ Correct
import { test, expect } from '../fixtures/inbox.fixture';

test('TC_INB_200 snooze to tomorrow @regression', async ({ inboxPage, inboxData }) => {
  // ...
});
```

### Action tests (Type 2) — own your data with serial mode

```typescript
test.describe('Snooze conversation', () => {
  test.describe.configure({ mode: 'serial' });

  let convId: string;

  test.beforeAll(async ({ inboxData }) => {
    convId = (await inboxData.createOwnedConversation('snooze')).id;
  });

  test.afterAll(async ({ inboxData }) => {
    try { await inboxData.deleteConversation(convId); } catch { /* never rethrow */ }
  });

  test('TC_INB_200 snooze to tomorrow @regression', async ({ inboxPage }) => {
    await inboxPage.gotoConversation(convId);
    await inboxPage.snooze('tomorrow');
    await expect(inboxPage.statusDropdown).toContainText(/snoozed/i);
  });
});
```

### Plan-gated tests (free vs paid)

```typescript
test('TC_AI_001 AI summary @regression', async ({ inboxPage }) => {
  test.skip(env.isFreePlan, 'AI features locked on free plan');
  test.slow();
  // ...
});
```

## TC numbering

| Range | Scope |
|-------|-------|
| AUTH 001–099 | Login, session, signup |
| INB 001–199 | Inbox smoke (read-only) |
| INB 200–399 | Inbox actions (mutating) |
| DSH/CON/BRD/SET | Per module |
| AI/KB/WF | Paid plan features |
| E_001+ | Cross-module E2E |

Module codes: `AUTH` `INB` `DSH` `CON` `BRD` `SET` `KB` `WF` `AI` `NOT`

## 10 rules — never violate

1. **Never `openFirstConversation()`** — use `gotoConversation(id)`. ESLint enforces this.
2. **Never `.first()` in tests** — navigate by ID. ESLint enforces this.
3. **Never `Date.now()` for naming** — use `uuid().slice(0, 8)`.
4. **Never `test.fixme` for plan gates** — use `test.skip(condition, reason)`.
5. **Never assertions inside POMs** — POMs return data, tests assert.
6. **Always `mode: 'serial'`** in describes that share a `convId`.
7. **Always `test.slow()`** on AI tests — after `test.skip()`.
8. **Always negative AI check** — `not.toMatch(/error|failed/i)` is mandatory.
9. **Always idempotent in seed-fixtures.ts** — check before borrowing.
10. **Always run cleanup-stale.ts before CI test run**.

## Failure triage

| Allure category | First action |
|----------------|--------------|
| Auth / session failures | `bash scripts/refresh-auth.sh` |
| AI response timeout | Check QA AI service health |
| Locator not found | Check selector with DevTools on qa-desk.bublly.com |
| Data / stale test data | `npm run cleanup` then `npm run seed` |
| Plan-gated (skipped) | Expected on free plan — no action needed |

## Adding a new module

1. Create `src/modules/<name>/` with: `locators/`, `pages/`, `helpers/`, `fixtures/`, `types/`, `tests/`, `index.ts`
2. Follow the inbox module structure exactly
3. Extend base: `src/core/fixtures/base.fixture.ts`
4. Module fixture exposes `<name>Page` + `<name>Data`
5. Tests import from `'../fixtures/<name>.fixture'`

## Phase roadmap

| Phase | Modules | Tests | Account |
|-------|---------|-------|---------|
| 1 (done) | Auth + Inbox smoke | 25 | free |
| 2 | Inbox actions + Dashboard | ~250 | free |
| 3 | Contacts + Boards + Settings | ~200 | free |
| 4 | AI / KB / Workflows + RBAC | ~100 | paid |
