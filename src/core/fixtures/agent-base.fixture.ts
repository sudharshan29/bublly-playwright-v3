import { test as base, expect } from './base.fixture';

export const test = base.extend<{ persona: string }>({
  persona: async ({}, use) => { await use('starterAgent'); },
});

export { expect };
