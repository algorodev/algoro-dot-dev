import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "src/content/_generated");

function ensureDir() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
}

export function writeJSON(filename: string, data: unknown) {
  ensureDir();
  const file = path.join(outDir, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  return file;
}

export function readJSON<T>(filename: string): T | null {
  const file = path.join(outDir, filename);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as T;
}
