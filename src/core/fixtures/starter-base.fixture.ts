import { test as base, expect } from './base.fixture';
import { PERSONAS } from '../../../config/personas';

type PersonaKey = keyof typeof PERSONAS;

export const test = base.extend<{ persona: PersonaKey }>({
  persona: async ({}, use) => { await use('starterAdmin'); },
});

export { expect };
