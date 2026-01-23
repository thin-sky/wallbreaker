import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { generateSearchIndex } from './src/integrations/generate-search-index.ts';

// https://astro.build/config
export default defineConfig({
  output: "static",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [generateSearchIndex()],

  // Native i18n configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  },
});
