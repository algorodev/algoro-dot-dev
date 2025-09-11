import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { ensureDir, BLOG_DIR, PROFILE_DIR } from '@lib/fs/paths';

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
    role?: string;
    location?: string;
    email?: string;
    links?: Record<string, string | undefined>;
  },
  mdxBody: string,
) {
  const linksClean: { [p: string]: string | undefined } | undefined = profile.links
    ? Object.fromEntries(Object.entries(profile.links).filter(([, v]) => typeof v === 'string'))
    : undefined;

  const frontmatterRaw = {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    email: profile.email,
    links: linksClean,
  };

  const frontmatter = sanitize(frontmatterRaw);

  const filepath = path.join(PROFILE_DIR, 'profile.mdx');
  const file = matter.stringify(mdxBody, frontmatter);
  ensureDir(PROFILE_DIR);
  fs.writeFileSync(filepath, file, 'utf-8');
  return filepath;
}
