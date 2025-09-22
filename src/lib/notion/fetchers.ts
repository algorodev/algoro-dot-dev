import { notion, resourceIds } from './client'
import { mapExperience, mapPost, mapProfile } from './mappers'
import type { Experience, Post, Profile } from './schemas.ts'

async function resolveDataSourceId(id: string): Promise<string> {
  if (id.startsWith('ntn_')) return id;

  const db: any = await notion.databases.retrieve({ database_id: id });
  const ds = db?.data_sources?.[0]?.id;
  if (!ds) {
    throw new Error(
      `[NOTION] Database ${id} has no accessible data sources for this integration. ` +
        `Ensure the integration is shared and the DB has at least one data source.`,
    );
  }
  return ds;
}

export async function fetchAllPosts(options?: { includeDrafts?: boolean }): Promise<Post[]> {
  const rawId = resourceIds.postsDb;
  if (!rawId) throw new Error('[NOTION] Missing NOTION_DB_POSTS');

  const dataSourceId = await resolveDataSourceId(rawId);
  const includeDrafts = !!options?.includeDrafts;

  const results: any[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const res: any = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    results.push(...(res.results ?? []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor ?? undefined;
  }

  const pages = results.filter((r: any) => r.object === 'page' && r.properties);
  let posts: Post[] = pages.map((p: any) => mapPost(p));

  if (!includeDrafts) {
    posts = posts.filter((p) => p.status === 'Published');
  }

  posts.sort((a, b) => {
    const ad = a.publishedAt ?? '';
    const bd = b.publishedAt ?? '';
    if (!ad && !bd) return 0;
    if (!ad) return 1;
    if (!bd) return -1;
    return bd.localeCompare(ad);
  });

  const slugs = new Set<string>();
  for (const p of posts) {
    if (!p.slug) throw new Error(`[NOTION] Post ${p.id} missing slug`);
    if (slugs.has(p.slug)) throw new Error(`[NOTION] Duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
  }

  return posts;
}

export async function fetchProfile(): Promise<Profile> {
  const rawId = resourceIds.profileDb;
  if (!rawId) throw new Error('[NOTION] Missing NOTION_DB_PROFILE');

  const dataSourceId = await resolveDataSourceId(rawId);

  const results: any[] = [];

  const res: any = await (notion as any).dataSources.query({
    data_source_id: dataSourceId,
    start_cursor: undefined,
  })
  results.push(...(res.results ?? []))

  const pages = results.filter((r: any) => r.object === 'page' && r.properties)
  return pages.map((p: any) => mapProfile(p))[0]
}

export async function fetchAllExperience(): Promise<Experience[]> {
  const rawId = resourceIds.experienceDb;
  if (!rawId) throw new Error('[NOTION] Missing NOTION_DB_EXPERIENCE');

  const dataSourceId = await resolveDataSourceId(rawId);

  const results: any[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const res: any = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    results.push(...(res.results ?? []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor ?? undefined;
  }

  const pages = results.filter((r: any) => r.object === 'page' && r.properties);
  return pages.map((e: any) => mapExperience(e));
}

export async function fetchAllBlocks(blockId: string) {
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const res: any = await (notion as any).blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...(res.results ?? []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor ?? undefined;
  }
  return blocks;
}
