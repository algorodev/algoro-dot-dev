import { getAllPosts } from '@content/posts';

export const prerender = true;

export async function GET({ site }: any) {
  const posts = await getAllPosts();
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${new URL(`/blog/${p.slug}`, site)}</link>
      <guid>${new URL(`/blog/${p.slug}`, site)}</guid>
      ${p.description ? `<description>${escapeXml(p.description)}</description>` : ''}
      ${p.date ? `<pubDate>${new Date(p.date).toUTCString()}</pubDate>` : ''}
    </item>
  `,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0"><channel>
    <title>algoro.dev</title>
    <link>${site}</link>
    <description>Blog feed</description>
    ${items}
  </channel></rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

function escapeXml(s = '') {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
