import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

interface SearchItem {
  type: 'blog' | 'product';
  title: string;
  description?: string;
  url: string;
  image?: string;
  date?: string;
  tags?: string[];
  category?: string;
}

interface SearchResults {
  products: SearchItem[];
  blog: SearchItem[];
  total: number;
}

/**
 * Search API endpoint
 * Searches across products, collections, and blog posts using pre-built index
 * GET /api/search?q=query&type=all|blog|products&limit=10
 */
app.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const type = c.req.query('type') || 'all'; // all, products, blog
    const limit = parseInt(c.req.query('limit') || '10', 10);

    if (!query || query.length < 2) {
      return c.json({
        query,
        results: {
          products: [],
          blog: [],
          total: 0,
        },
      });
    }

    // Fetch pre-built search index
    // In production, this should be cached or served from KV/R2
    let searchIndex: SearchItem[] = [];
    try {
      const response = await fetch(new URL('/search-index.json', c.req.url).toString());
      if (response.ok) {
        searchIndex = await response.json() as SearchItem[];
      }
    } catch (error) {
      console.error('Failed to load search index:', error);
      // Return empty results if index not available
      return c.json({
        query,
        results: {
          products: [],
          blog: [],
          total: 0,
        },
      });
    }

    const searchLower = query.toLowerCase();
    const results: SearchResults = {
      products: [],
      blog: [],
      total: 0,
    };

    // Filter and search items
    const matchedItems = searchIndex.filter(item => {
      // Filter by type if specified
      if (type !== 'all' && item.type !== type) {
        return false;
      }

      // Search in title
      if (item.title.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in description
      if (item.description?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in tags
      if (item.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
        return true;
      }

      // Search in category
      if (item.category?.toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });

    // Group by type and limit results
    for (const item of matchedItems) {
      if (item.type === 'blog') {
        if (results.blog.length < limit) {
          results.blog.push(item);
        }
      } else if (item.type === 'product') {
        if (results.products.length < limit) {
          results.products.push(item);
        }
      }
    }

    results.total = results.blog.length + results.products.length;

    return c.json({
      query,
      results,
    });

  } catch (error) {
    console.error('Search error:', error);
    return c.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;
