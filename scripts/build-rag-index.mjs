import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { join, basename, extname } from 'node:path';
import matter from 'gray-matter';
import { GoogleGenAI } from '@google/genai';

const EMBED_MODEL = 'gemini-embedding-001';
const DIM = 768;

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'src', 'content');
const OUTPUT_FILE = join(ROOT, 'src', 'data', 'rag-index.json');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    '[rag-index] GEMINI_API_KEY not set — skipping rebuild. Existing src/data/rag-index.json will be used as-is.',
  );
  process.exit(0);
}

const stripMdxComments = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const collapseWhitespace = (s) => s.replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function urlFor(collection, slug) {
  if (collection === 'work') return `/work/${slug}`;
  return '/about';
}

function synthesizeHeader(collection, data) {
  if (collection === 'profile') {
    const parts = [
      `${data.name}, ${data.role}.`,
      `Raised in ${data.raised}, based in ${data.based}.`,
    ];
    if (data.skills?.length) parts.push(`Skills: ${data.skills.join(', ')}.`);
    return parts.join(' ');
  }
  if (collection === 'experience') {
    const period = data.end ? `${data.start} — ${data.end}` : `${data.start} — present`;
    const org = data.organization ? ` at ${data.organization}` : '';
    return `${data.title}${org} in ${data.location}. ${period}.`;
  }
  if (collection === 'work') {
    const parts = [`${data.title} (${data.year}) — ${data.client}.`, data.summary];
    if (data.stack?.length) parts.push(`Stack: ${data.stack.join(', ')}.`);
    if (data.tags?.length) parts.push(`Tags: ${data.tags.join(', ')}.`);
    if (data.metrics?.length) {
      const m = data.metrics
        .map((x) => `${x.label}: ${x.value}${x.unit ?? ''}`)
        .join('; ');
      parts.push(`Metrics: ${m}.`);
    }
    return parts.join(' ');
  }
  return '';
}

function chunksForFile(collection, slug, data, body) {
  const out = [];
  const title = data.title || data.name;
  const url = urlFor(collection, slug);

  out.push({
    id: `${collection}/${slug}#header`,
    collection,
    slug,
    title,
    section: 'header',
    url,
    text: collapseWhitespace(synthesizeHeader(collection, data)),
  });

  const cleanBody = stripMdxComments(body).trim();
  if (!cleanBody) return out;

  // Split on `## ` headings. If the body starts with `## ` directly, normalize so it
  // counts as a delimiter (otherwise segments[0] would carry the literal `## Heading`).
  const normalized = cleanBody.startsWith('## ') ? '\n' + cleanBody : cleanBody;
  const segments = normalized.split(/\n## /);
  const intro = segments[0].trim();
  const sections = segments.slice(1);

  if (intro && sections.length === 0) {
    out.push({
      id: `${collection}/${slug}#body`,
      collection,
      slug,
      title,
      section: 'body',
      url,
      text: collapseWhitespace(intro),
    });
    return out;
  }

  if (intro) {
    out.push({
      id: `${collection}/${slug}#intro`,
      collection,
      slug,
      title,
      section: 'intro',
      url,
      text: collapseWhitespace(intro),
    });
  }

  for (const segment of sections) {
    const lineEnd = segment.indexOf('\n');
    const heading = (lineEnd === -1 ? segment : segment.slice(0, lineEnd)).trim();
    const content = lineEnd === -1 ? '' : segment.slice(lineEnd + 1).trim();
    if (!content) continue;
    out.push({
      id: `${collection}/${slug}#${slugify(heading)}`,
      collection,
      slug,
      title,
      section: heading,
      url,
      text: collapseWhitespace(`${heading}. ${content}`),
    });
  }

  return out;
}

function readCollection(name) {
  const dir = join(CONTENT_DIR, name);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    const slug = basename(file, extname(file));
    const raw = readFileSync(join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    out.push(...chunksForFile(name, slug, data, content));
  }
  return out;
}

const chunks = [
  ...readCollection('profile'),
  ...readCollection('experience'),
  ...readCollection('work'),
];

if (chunks.length === 0) {
  console.error('[rag-index] no chunks produced — aborting');
  process.exit(1);
}

console.log(
  `[rag-index] embedding ${chunks.length} chunks with ${EMBED_MODEL} (dim=${DIM})…`,
);

const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.embedContent({
  model: EMBED_MODEL,
  contents: chunks.map((c) => c.text),
  config: {
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: DIM,
  },
});

if (!response.embeddings || response.embeddings.length !== chunks.length) {
  throw new Error(
    `Embedding count mismatch: got ${response.embeddings?.length ?? 0}, expected ${chunks.length}`,
  );
}

const indexed = chunks.map((c, i) => {
  const values = response.embeddings[i].values;
  if (!values || values.length !== DIM) {
    throw new Error(`Chunk ${c.id}: expected ${DIM}-dim vector, got ${values?.length ?? 0}`);
  }
  return { ...c, embedding: values };
});

mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  JSON.stringify({ model: EMBED_MODEL, dim: DIM, chunks: indexed }) + '\n',
);

console.log(
  `[rag-index] wrote ${chunks.length} chunks → src/data/rag-index.json (${(JSON.stringify(indexed).length / 1024).toFixed(1)} KiB)`,
);
