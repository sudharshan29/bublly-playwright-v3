import { env } from './environment';

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
