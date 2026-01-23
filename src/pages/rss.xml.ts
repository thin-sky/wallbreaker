import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog', ({ data }) => {
    return data.draft !== true;
  });
  
  const posts = blog.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  
  return rss({
    title: 'Wallbreaker Blog',
    description: 'News, updates, and stories from our community',
    site: context.site || 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
