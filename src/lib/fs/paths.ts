import path from 'node:path';
import fs from 'node:fs';

const project = () => process.cwd();

export const CONTENT_DIR = path.join(project(), 'src/content');
export const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
export const PROFILE_DIR = path.join(CONTENT_DIR, 'profile');
export const PUBLIC_DIR = path.join(project(), 'public');
export const NOTION_PUBLIC_DIR = path.join(PUBLIC_DIR, 'notion');

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function ensureBaseDirs() {
  ensureDir(BLOG_DIR);
  ensureDir(PROFILE_DIR);
  ensureDir(NOTION_PUBLIC_DIR);
}
