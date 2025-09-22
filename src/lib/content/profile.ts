export async function getProfile() {
  const modules = import.meta.glob<any>('/src/content/profile/**/*.mdx', { eager: true });
  return Object.values(modules)[0] as any;
}
