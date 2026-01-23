/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

import type { Env } from './types';

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: string;
      email: string;
    };
  }
}
