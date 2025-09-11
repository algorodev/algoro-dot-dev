import { notion, resourceIds } from "./client";
import { mapPost, mapProfileFromPage } from "./mappers";
import type { Post, Profile } from "./schemas.ts";

export async function fetchAllPosts(options?: { includeDrafts?: boolean }): Promise<Post[]> {
  if (!resourceIds.postsDb) throw new Error("[NOTION] Missing NOTION_DB_POSTS");
  const includeDrafts = !!options?.includeDrafts;

  const results: any[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    const res = await notion.databases.query({
      database_id: resourceIds.postsDb!,
      start_cursor: cursor,
      filter: includeDrafts
        ? undefined
        : { property: "Status", select: { equals: "Published" } },
      sorts: [{ property: "PublishedAt", direction: "descending" }]
    });
    results.push(...res.results);
    hasMore = res.has_more;
    cursor = res.next_cursor ?? undefined;
  }

  const pages = results.filter((r: any) => r.object === "page" && r.properties);
  const posts = pages.map(mapPost);

  const slugs = new Set<string>();
  for (const p of posts) {
    if (!p.slug) throw new Error(`[NOTION] Post ${p.id} missing slug`);
    if (slugs.has(p.slug)) throw new Error(`[NOTION] Duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
  }
  return posts;
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  if (!resourceIds.postsDb) throw new Error("[NOTION] Missing NOTION_DB_POSTS");
  const res = await notion.databases.query({
    database_id: resourceIds.postsDb!,
    filter: { property: "Slug", rich_text: { equals: slug } },
    page_size: 1
  });
  const page = res.results[0] as any;
  if (!page) return null;
  return mapPost(page);
}

export async function fetchProfile(): Promise<Profile> {
  if (resourceIds.profilePage) {
    const page = await notion.pages.retrieve({ page_id: resourceIds.profilePage });
    const avatarUrl = await fetchPageIconAsUrl(resourceIds.profilePage); // optional helper
    const aboutBlocks = await fetchAllBlocks(resourceIds.profilePage);
    return mapProfileFromPage(page as any, { avatarUrl, aboutBlocks });
  }
  throw new Error("[NOTION] Provide NOTION_PROFILE_PAGE (or implement DB variant).");
}

export async function fetchAllBlocks(blockId: string) {
  const blocks: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100
    });
    blocks.push(...res.results);
    hasMore = res.has_more;
    cursor = res.next_cursor ?? undefined;
  }
  return blocks;
}

async function fetchPageIconAsUrl(pageId?: string): Promise<string | undefined> {
  if (!pageId) return undefined;
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const icon: any = (page as any).icon;
    if (!icon) return undefined;
    if (icon.type === "external") return icon.external?.url;
    if (icon.type === "file") return icon.file?.url;
  } catch {
    // ignore
  }
  return undefined;
}
