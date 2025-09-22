import { z } from 'zod'

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().min(1),
  status: z.enum(['Draft', 'Published']),
  publishedAt: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  coverUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
  canonicalURL: z.string().url().optional(),
  readingTimeMinutes: z.number().int().nonnegative().optional(),
})
export type Post = z.infer<typeof PostSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  raised: z.string(),
  based: z.string(),
  email: z.string().email(),
  skills: z.array(z.string()).default([]),
  image: z.string(),
})
export type Profile = z.infer<typeof ProfileSchema>;

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string().optional(),
  location: z.string(),
  start: z.string(),
  end: z.string().optional(),
})
export type Experience = z.infer<typeof ExperienceSchema>;
