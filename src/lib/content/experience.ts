export async function getAllExperiences() {
  const modules = import.meta.glob<any>('/src/content/experience/**/*.mdx', { eager: true });
  return Object.values(modules);
}
