function baseName(path: string) {
  return path
    .split('/')
    .pop()!
    .replace(/\.mdx?$/, '');
}

export async function getProfile() {
  const modules = import.meta.glob<any>('/src/content/profile/**/*.mdx', { eager: true });
  const profiles = Object.entries(modules).map(([file, mod]) => {
    const fm = mod.frontmatter || {};
    const slug = fm.slug || baseName(file);
    return { file, slug, ...fm, Content: mod.default };
  });

  if (profiles.length === 0) {
    throw new Error('No profile found');
  }

  return profiles[0];
}
