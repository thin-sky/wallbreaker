/**
 * Generate search index at build time
 * This script generates a JSON index of all searchable content
 */
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

async function generateSearchIndex() {
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
  
  // Write search index to public directory
  const outputPath = path.join(process.cwd(), 'public', 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
  
  console.log(`Search index generated: ${outputPath}`);
  console.log(`Total items: ${searchIndex.length}`);
}

generateSearchIndex().catch(console.error);
