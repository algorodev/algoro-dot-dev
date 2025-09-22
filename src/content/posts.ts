export type PostModule = {
  file: string;
  url?: string;
  frontmatter: {
    title: string;
    description?: string;
    publishedAt?: string | Date;
    tags?: string[];
    draft?: boolean;
    cover?: string;
    slug?: string;
  };
  default: any;
};

function baseName(path: string) {
  return path
    .split('/')
    .pop()!
    .replace(/\.mdx?$/, '');
}

export async function getAllPosts(opts?: { includeDrafts?: boolean }) {
  const modules = import.meta.glob<PostModule>('/src/content/blog/**/*.mdx', { eager: true });
  const posts = Object.entries(modules).map(([file, mod]) => {
    const fm = mod.frontmatter || {};
    const slug = fm.slug || baseName(file);
    return { file, slug, ...fm, Content: mod.default };
  });

  const onlyPublished = (opts?.includeDrafts ?? false) ? posts : posts.filter((p) => !p.draft);

  const parsed = onlyPublished.map((p) => ({
    ...p,
    publishedAt: p.publishedAt ? new Date(p.publishedAt) : undefined,
  }));

  return parsed.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

export async function getPostBySlug(slug: string) {
  const all = await getAllPosts();
  return all.find((p) => p.slug === slug);
}

export async function getAllTags() {
  const posts = await getAllPosts();
  const set = new Set<string>();
  posts.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
