import 'dotenv/config';
import { fetchAllPosts, fetchAllBlocks, fetchProfile } from '@lib/notion/fetchers';
import { blocksToMDX } from '@lib/notion/blocks-to-mdx';
import { writePostMDX, writeProfileMDX } from '@lib/mdx/mdx-writer';
import { ensureBaseDirs } from '@lib/fs/paths';
import { notion } from '@lib/notion/client';

async function loadChildren(blockId: string): Promise<any[]> {
  const children: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    children.push(...(res.results ?? []));
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return children;
}

async function main() {
  ensureBaseDirs();

  const posts = await fetchAllPosts({ includeDrafts: false });
  let ok = 0;
  for (const post of posts) {
    const blocks = await fetchAllBlocks(post.id);
    const { mdx, coverPath } = await blocksToMDX(post.id, blocks, {
      coverUrl: post.coverUrl,
      loadChildren,
    });
    if (coverPath) post.coverUrl = coverPath;
    const out = writePostMDX(post, mdx);
    console.log(`[mdx] Wrote ${post.slug} → ${out}`);
    ok++;
  }

  try {
    const profile = await fetchProfile();
    const aboutBlocks = (profile as any).aboutBlocks ?? [];
    const { mdx } = await blocksToMDX(profile.id, aboutBlocks, {
      coverUrl: profile.avatarUrl,
      loadChildren,
    });
    const out = writeProfileMDX(profile, mdx || '');
    console.log(`[mdx] Wrote profile → ${out}`);
  } catch (e) {
    console.warn('[mdx] Skipping profile generation:', (e as Error).message);
  }

  console.log(`[mdx] Done. Generated ${ok} file(s).`);
}

main().catch((err) => {
  console.error('[mdx] FAILED:', err);
  process.exit(1);
});
