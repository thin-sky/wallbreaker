/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

import type { Env } from './types';

// Navigation API types (for View Transitions)
interface NavigationActivation {
  from: NavigationHistoryEntry | null;
  entry: NavigationHistoryEntry;
}

interface Navigation {
  activation: NavigationActivation;
}

declare global {
  const navigation: Navigation | undefined;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: string;
      email: string;
    };
  }
}
