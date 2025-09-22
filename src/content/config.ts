import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    status: z.enum(['Draft', 'Published']),
    publishedAt: z.string().nullable(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    cover: z.string().optional(),
    featured: z.boolean().optional(),
    canonicalURL: z.string().url().optional(),
    readingTimeMinutes: z.number().int().nonnegative().optional(),
  }),
});

const profile = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    raised: z.string(),
    based: z.string(),
    email: z.string().email(),
    skills: z.array(z.string()).default([]),
    image: z.string(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experience' }),
  schema: z.object({
    title: z.string(),
    organization: z.string().optional(),
    location: z.string(),
    start: z.string(),
    end: z.string().optional(),
  }),
})

export const collections = { blog, profile, experience };
