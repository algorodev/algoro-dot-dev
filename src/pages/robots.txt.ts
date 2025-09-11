export const prerender = true;

export function GET({ site }: any) {
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
