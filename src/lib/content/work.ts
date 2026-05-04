function baseName(path: string) {
  return path
    .split('/')
    .pop()!
    .replace(/\.mdx?$/, '');
}

export async function getAllWork() {
  const modules = import.meta.glob<any>('/src/content/work/**/*.mdx', { eager: true });
  const entries = Object.entries(modules).map(([file, mod]) => {
    const fm = mod.frontmatter || {};
    const slug = fm.slug || baseName(file);
    return { file, slug, ...fm, Content: mod.default };
  });

  return entries.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const ao = a.order ?? 999;
    const bo = b.order ?? 999;
    if (ao !== bo) return ao - bo;
    return (b.year ?? '').localeCompare(a.year ?? '');
  });
}

export async function getWorkBySlug(slug: string) {
  const all = await getAllWork();
  return all.find((w) => w.slug === slug);
}
