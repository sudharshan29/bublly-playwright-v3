import { env } from './environment';

export const PERSONAS = {
  freeUser: {
    authFile: '.auth/free-user.json',
    email:    env.freeUser.email,
  },
  // paidUser: global-setup only logs in freeUser — .auth/paid-user.json is never written.
  // Any test that sets persona:'paidUser' will throw "Auth file not found" until
  // global-setup is extended to handle this persona.
  paidUser: {
    authFile: '.auth/paid-user.json',
    email:    env.paidUser.email,
  },
} as const;
