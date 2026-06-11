import { env } from './environment';

export const PERSONAS = {
  freeUser: {
    authFile: '.auth/free-user.json',
    email:    env.freeUser.email,
  },
  paidUser: {
    authFile: '.auth/paid-user.json',
    email:    env.paidUser.email,
  },
} as const;
