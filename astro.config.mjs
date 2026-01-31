import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: "static", // Static pages + API routes (API routes are always server-rendered)
  vite: {
    // Avoid stale SSR deps with Cloudflare workerd dev (middleware virtual module)
    optimizeDeps: {
      exclude: ["astro/virtual-modules/middleware"],
    },
  },
  adapter: cloudflare({
    // Astro v6: workerd is now the default dev runtime
    // platformProxy is no longer needed for development
    imageService: 'compile', // Compile images at build time (no Sharp needed at runtime)
    // Configure session KV binding name to match wrangler.jsonc
    sessionKVBindingName: 'SESSIONS',
  }),

  // Native i18n configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
