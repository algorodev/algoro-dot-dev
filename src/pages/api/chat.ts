import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import ragIndexJson from '../../data/rag-index.json';

export const prerender = false;

type Chunk = {
  id: string;
  collection: 'profile' | 'experience' | 'work';
  slug: string;
  title: string;
  section: string;
  url: string;
  text: string;
  embedding: number[];
};

type RagIndex = {
  model: string;
  dim: number;
  chunks: Chunk[];
};

const ragIndex = ragIndexJson as RagIndex;

const GENERATION_MODEL = 'gemini-2.5-flash';
const EMBED_MODEL = 'gemini-embedding-001';
const TOP_K = 5;
const MAX_MESSAGES = 30;
const MAX_CONTENT_LEN = 4000;

// Rate limiter (Upstash). Disabled when creds are unset so local dev keeps working.
const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? import.meta.env.UPSTASH_REDIS_REST_URL;
const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  upstashUrl && upstashToken
    ? new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'algoro-chat',
        analytics: true,
      })
    : null;

const SYSTEM_PROMPT = `You are the live "ask the portfolio" assistant on algoro.dev — Alejandro Gonzalez Romero's personal site. Visitors ask questions about Alejandro's experience, projects, and skills; you answer using only the source material provided.

Rules:
- Speak about Alejandro in the third person.
- Use only the <sources> block below. Do not use outside knowledge or speculate. If the sources do not contain the answer, say so plainly in one short sentence.
- Be concise — typically 2 to 4 sentences. Prefer specifics (technologies, decisions, outcomes) over generalities.
- Cite inline with bracketed numbers like [1], [2] referring to the source numbers below. Place a marker at the end of any sentence or claim that uses information from a specific source. Do not append a list of sources at the end — the inline markers are the only citation format.
- Match the tone of the site: direct, technical, no marketing fluff.`;

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

function sse(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type IncomingMessage = { role: 'user' | 'assistant' | 'model'; content: string };

export const POST: APIRoute = async ({ request }) => {
  // Vercel exposes env vars on `process.env`; Astro dev only on `import.meta.env`.
  const apiKey = process.env.GEMINI_API_KEY ?? import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError(500, 'Chat endpoint not configured (missing GEMINI_API_KEY).');
  }

  if (ratelimit) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return new Response(
        JSON.stringify({
          error: `Too many requests. Try again in ${retryAfter}s.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(retryAfter),
          },
        },
      );
    }
  }

  let body: { messages?: IncomingMessage[] };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError(400, 'Body must include a non-empty `messages` array.');
  }
  if (messages.length > MAX_MESSAGES) {
    return jsonError(400, `Too many messages (max ${MAX_MESSAGES}).`);
  }
  for (const m of messages) {
    if (!m || typeof m.content !== 'string' || !m.content.trim()) {
      return jsonError(400, 'Each message needs a non-empty `content` string.');
    }
    if (m.content.length > MAX_CONTENT_LEN) {
      return jsonError(400, `Message too long (max ${MAX_CONTENT_LEN} chars).`);
    }
    if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'model') {
      return jsonError(400, `Unsupported role: ${m.role}`);
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return jsonError(400, 'Last message must be from the user.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Embed the latest user query for retrieval.
  let queryVec: number[] | undefined;
  try {
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: lastUser.content,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: ragIndex.dim,
      },
    });
    queryVec = res.embeddings?.[0]?.values;
  } catch (err) {
    console.error('[chat] embed failed', err);
    return jsonError(502, 'Failed to embed query.');
  }
  if (!queryVec || queryVec.length !== ragIndex.dim) {
    return jsonError(502, 'Embedding response was malformed.');
  }

  // Cosine top-K against the static index.
  const ranked = ragIndex.chunks
    .map((chunk) => ({ chunk, score: cosine(queryVec!, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const sourcesPrompt = ranked
    .map((r, i) => {
      const where =
        r.chunk.section === 'header'
          ? `${r.chunk.collection}/${r.chunk.slug}`
          : `${r.chunk.collection}/${r.chunk.slug}#${r.chunk.section}`;
      return `[${i + 1}] (${where})\n${r.chunk.text}`;
    })
    .join('\n\n');

  const sourcesPayload = ranked.map((r, i) => ({
    n: i + 1,
    title: r.chunk.title,
    section: r.chunk.section,
    url: r.chunk.url,
    score: Number(r.score.toFixed(3)),
  }));

  const systemInstruction = `${SYSTEM_PROMPT}\n\n<sources>\n${sourcesPrompt}\n</sources>`;

  // Translate to Gemini's content format. assistant → model.
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : m.role,
    parts: [{ text: m.content }],
  }));

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        controller.enqueue(
          encoder.encode(sse({ type: 'sources', sources: sourcesPayload })),
        );

        const geminiStream = await ai.models.generateContentStream({
          model: GENERATION_MODEL,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 500,
            abortSignal: request.signal,
          },
        });

        for await (const chunk of geminiStream) {
          if (request.signal.aborted) break;
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(sse({ type: 'text', text })));
          }
        }

        if (!request.signal.aborted) {
          controller.enqueue(encoder.encode(sse({ type: 'done' })));
        }
      } catch (err) {
        if (request.signal.aborted) {
          // Client disconnected — silent close.
        } else {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[chat] generation failed', err);
          controller.enqueue(encoder.encode(sse({ type: 'error', error: message })));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};
