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
})

export const collections = { profile, experience };
