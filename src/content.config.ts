import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog Content Collection
 * Markdown-based blog posts with full i18n support
 * Migrated to Content Layer API (Astro v6)
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Staff'),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog,
};
