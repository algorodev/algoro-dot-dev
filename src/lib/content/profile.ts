export async function getProfile() {
  const modules = import.meta.glob<any>('/src/content/profile/**/*.mdx', { eager: true });
  const entry = Object.values(modules)[0] as any;
  if (!entry) throw new Error('Profile MDX not found');
  return { Content: entry.default, frontmatter: entry.frontmatter ?? {} };
}
