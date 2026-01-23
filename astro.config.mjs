import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: "static", // Static pages + API routes (API routes are always server-rendered)
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'passthrough', // Use passthrough for Cloudflare Workers (sharp doesn't work in Workers)
  }),

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
