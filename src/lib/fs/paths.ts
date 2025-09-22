import path from 'node:path';
import fs from 'node:fs';

const project = () => process.cwd();

export const CONTENT_DIR = path.join(project(), 'src/content');
export const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
export const PROFILE_DIR = path.join(CONTENT_DIR, 'profile');
export const EXPERIENCE_DIR = path.join(CONTENT_DIR, 'experience');
export const PUBLIC_DIR = path.join(project(), 'public');
export const NOTION_PUBLIC_DIR = path.join(PUBLIC_DIR, 'notion');

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function clearContentDirs() {
  if (fs.existsSync(BLOG_DIR)) {
    const blogFiles = fs.readdirSync(BLOG_DIR);
    for (const file of blogFiles) {
      if (file.endsWith('.mdx')) {
        fs.unlinkSync(path.join(BLOG_DIR, file));
      }
    }
  }

  if (fs.existsSync(PROFILE_DIR)) {
    const profileFiles = fs.readdirSync(PROFILE_DIR);
    for (const file of profileFiles) {
      if (file.endsWith('.mdx')) {
        fs.unlinkSync(path.join(PROFILE_DIR, file));
      }
    }
  }

  if (fs.existsSync(EXPERIENCE_DIR)) {
    const experienceFiles = fs.readdirSync(EXPERIENCE_DIR);
    for (const file of experienceFiles) {
      if (file.endsWith('.mdx')) {
        fs.unlinkSync(path.join(EXPERIENCE_DIR, file));
      }
    }
  }
}

export function ensureBaseDirs() {
  ensureDir(BLOG_DIR);
  ensureDir(PROFILE_DIR);
  ensureDir(EXPERIENCE_DIR);
  ensureDir(NOTION_PUBLIC_DIR);
}
