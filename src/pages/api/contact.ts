// TODO: Phase 2 — wire up Resend (or similar) for actual email delivery.
// To make this endpoint live: add an Astro SSR/hybrid adapter (e.g. @astrojs/vercel, @astrojs/node),
// flip `prerender` to false, and replace the GET stub with a POST that validates and forwards
// the payload. Until then the form falls back to a client-side submit handler that records the
// submission in the browser console.

export const prerender = true;

export function GET() {
  return new Response(
    JSON.stringify({
      ok: false,
      message: 'Contact endpoint is not live yet — see TODO in src/pages/api/contact.ts',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'POST',
      },
    },
  );
}
