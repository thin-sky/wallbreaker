import type { APIRoute} from 'astro';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site || 'https://yourdomain.com';
  
  // Define all static pages
  const pages = [
    '/',
    '/products',
    '/collections',
    '/blog',
    '/about',
    '/faq',
    '/design-system',
  ];
  
  // Define all supported locales
  const locales = ['en', 'es', 'fr'];
  
  // Generate sitemap entries for all page/locale combinations
  const urls: string[] = [];
  
  for (const locale of locales) {
    for (const page of pages) {
      // Skip locale prefix for English (default)
      const path = locale === 'en' ? page : `/${locale}${page}`;
      const url = `${baseUrl}${path}`;
      urls.push(url);
    }
  }
  
  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
