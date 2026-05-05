import type { APIRoute } from 'astro';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const prerender = false;

const ContactBody = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  email: z.string().trim().email('Please use a valid email.').max(200),
  company: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(200).optional()),
  type: z.enum(['contract', 'fulltime', 'project', 'other']),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.').max(4000),
  // Honeypot — must be empty for real users.
  website: z.string().max(0).optional(),
});

type ContactBody = z.infer<typeof ContactBody>;

const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? import.meta.env.UPSTASH_REDIS_REST_URL;
const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  upstashUrl && upstashToken
    ? new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        prefix: 'algoro-contact',
        analytics: true,
      })
    : null;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!,
  );
}

const TYPE_LABELS: Record<ContactBody['type'], string> = {
  contract: 'Contract',
  fulltime: 'Full-time',
  project: 'Project / services',
  other: 'Other',
};

function formatTelegramMessage(data: ContactBody): string {
  const e = escapeHtml;
  const lines = [
    '🆕 <b>algoro.dev — contact</b>',
    '',
    `<b>Name:</b> ${e(data.name)}`,
    `<b>Email:</b> ${e(data.email)}`,
  ];
  if (data.company) lines.push(`<b>Company:</b> ${e(data.company)}`);
  lines.push(`<b>Type:</b> ${e(TYPE_LABELS[data.type])}`);
  lines.push('', e(data.message));
  return lines.join('\n');
}

async function sendToTelegram(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Telegram API ${res.status}: ${detail.slice(0, 200)}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN ?? import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId =
    process.env.TELEGRAM_CHAT_ID ?? import.meta.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return jsonError(
      500,
      'Contact endpoint not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID).',
    );
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
          error: `Too many submissions. Try again in ${retryAfter}s.`,
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  // Honeypot — silently succeed so bots don't learn the trick.
  if (
    raw &&
    typeof raw === 'object' &&
    'website' in raw &&
    typeof (raw as { website: unknown }).website === 'string' &&
    (raw as { website: string }).website.length > 0
  ) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = ContactBody.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(400, first?.message ?? 'Invalid form data.');
  }

  try {
    await sendToTelegram(botToken, chatId, formatTelegramMessage(parsed.data));
  } catch (err) {
    console.error('[contact] Telegram delivery failed', err);
    return jsonError(502, 'Failed to deliver message. Please try again later.');
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
