import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

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
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    year: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    metrics: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          unit: z.string().optional(),
        }),
      )
      .optional(),
    featured: z.boolean().default(false),
    order: z.number().optional(),
    linkLabel: z.string().optional(),
  }),
});

export const collections = { profile, experience, work };
