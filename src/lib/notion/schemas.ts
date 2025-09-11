import { z } from "zod";

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().min(1),
  status: z.enum(["Draft", "Published"]),
  publishedAt: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  coverUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
  canonicalURL: z.string().url().optional(),
  readingTimeMinutes: z.number().int().nonnegative().optional()
});
export type Post = z.infer<typeof PostSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  shortBio: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  links: z.record(z.string(), z.string()).optional(),
  avatarUrl: z.string().url().optional(),
  aboutBlocks: z.array(z.any()).optional(),
  skills: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  timeline: z.array(z.string()).optional()
});
export type Profile = z.infer<typeof ProfileSchema>;
