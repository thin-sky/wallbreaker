import type { AstroIntegration } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';

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

export function generateSearchIndex(): AstroIntegration {
  return {
    name: 'generate-search-index',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        console.log('Generating search index...');
        
        const searchIndex: SearchItem[] = [];
        
        // Index blog posts
        try {
          const blogPosts = await getCollection('blog');
          
          for (const post of blogPosts) {
            if (post.data.draft) continue;
            
            searchIndex.push({
              type: 'blog',
              title: post.data.title,
              description: post.data.description,
              url: `/blog/${post.slug}/`,
              image: post.data.heroImage,
              date: post.data.pubDate.toISOString(),
              tags: post.data.tags,
              category: post.data.category,
            });
          }
          
          console.log(`Indexed ${blogPosts.length} blog posts`);
        } catch (error) {
          console.error('Error indexing blog posts:', error);
        }
        
        // Write search index to output directory
        // For static builds, public/ contents are copied to the output root
        // So we write directly to the output directory root
        const outputPath = path.join(dir.path, 'search-index.json');
        
        // Ensure directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
        
        console.log(`Search index generated: ${outputPath}`);
        console.log(`Total items: ${searchIndex.length}`);
      },
    },
  };
}
