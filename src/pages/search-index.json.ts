/**
 * Search Index Endpoint (Astro v6)
 * Generates a JSON index of all searchable content at build time
 * This replaces the prebuild script approach which doesn't work with Content Layer API
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Prerender this endpoint to generate the JSON file at build time
export const prerender = true;

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

export const GET: APIRoute = async () => {
  const searchIndex: SearchItem[] = [];
  
  // Index blog posts
  try {
    const blogPosts = await getCollection('blog');
    
    for (const post of blogPosts) {
      // Skip draft posts
      if (post.data.draft) continue;
      
      searchIndex.push({
        type: 'blog',
        title: post.data.title,
        description: post.data.description,
        url: `/blog/${post.id}/`,
        image: post.data.heroImage,
        date: post.data.pubDate.toISOString(),
        tags: post.data.tags,
        category: post.data.category,
      });
    }
  } catch (error) {
    console.error('Error indexing blog posts:', error);
  }
  
  // Return the search index as JSON
  return new Response(JSON.stringify(searchIndex, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
