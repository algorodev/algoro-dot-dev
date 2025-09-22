import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { ensureDir, BLOG_DIR, PROFILE_DIR, EXPERIENCE_DIR } from '@lib/fs/paths'

function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map((v) => sanitize(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v === undefined) continue;
      const sv = sanitize(v);
      out[k] = sv;
    }
    return out as unknown as T;
  }
  return value;
}

export function writePostMDX(
  post: {
    title: string;
    slug: string;
    status: 'Draft' | 'Published';
    publishedAt: string | null | undefined;
    tags?: string[];
    excerpt?: string | undefined;
    coverUrl?: string | undefined;
    featured?: boolean | undefined;
    canonicalURL?: string | undefined;
    readingTimeMinutes?: number | undefined;
  },
  mdxBody: string,
) {
  const frontmatterRaw = {
    title: post.title,
    slug: post.slug,
    status: post.status,
    publishedAt: post.publishedAt ?? null,
    tags: post.tags ?? [],
    excerpt: post.excerpt,
    cover: post.coverUrl,
    featured: post.featured,
    canonicalURL: post.canonicalURL,
    readingTimeMinutes: post.readingTimeMinutes,
  };

  const frontmatter = sanitize(frontmatterRaw);

  const filepath = path.join(BLOG_DIR, `${post.slug}.mdx`);
  const file = matter.stringify(mdxBody, frontmatter);
  ensureDir(BLOG_DIR);
  fs.writeFileSync(filepath, file, 'utf-8');
  return filepath;
}

export function writeProfileMDX(
  profile: {
    id: string;
    name: string;
    role: string;
    bio: string;
    raised: string;
    based: string;
    email: string;
    skills?: string[];
    image: string;
  },
  mdxBody: string,
) {
  const frontmatterRaw = {
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    raised: profile.raised,
    based: profile.based,
    email: profile.email,
    skills: profile.skills,
    image: profile.image,
  };

  const frontmatter = sanitize(frontmatterRaw);

  const filepath = path.join(PROFILE_DIR, 'profile.mdx');
  const file = matter.stringify(mdxBody, frontmatter);
  ensureDir(PROFILE_DIR);
  fs.writeFileSync(filepath, file, 'utf-8');
  return filepath;
}

export function writeExperienceMDX(
  experience: {
    id: string;
    title: string;
    organization?: string;
    location: string;
    start: string;
    end?: string;
  },
  mdxBody: string,
) {
  const frontmatterRaw = {
    title: experience.title,
    organization: experience.organization,
    location: experience.location,
    start: experience.start,
    end: experience.end,
  };

  const frontmatter = sanitize(frontmatterRaw);

  const filepath = path.join(EXPERIENCE_DIR, `experience-${experience.id}.mdx`);
  const file = matter.stringify(mdxBody, frontmatter);
  ensureDir(EXPERIENCE_DIR)
  fs.writeFileSync(filepath, file, 'utf-8');
  return filepath;
}
