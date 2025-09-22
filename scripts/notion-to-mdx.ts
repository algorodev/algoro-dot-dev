import 'dotenv/config';
import { fetchAllPosts, fetchAllBlocks, fetchProfile, fetchAllExperience } from '@lib/notion/fetchers'
import { blocksToMDX } from '@lib/notion/blocks-to-mdx';
import { writeExperienceMDX, writePostMDX, writeProfileMDX } from '@lib/mdx/mdx-writer'
import { ensureBaseDirs, clearContentDirs } from '@lib/fs/paths';
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
  console.log('[mdx] Clearing existing content...');
  clearContentDirs();
  ensureBaseDirs();

  console.log('[mdx] Starting to fetch content from Notion...');
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
    const blocks = await fetchAllBlocks(profile.id);
    const { mdx } = await blocksToMDX(profile.id, blocks, {
      loadChildren,
    })
    const out = writeProfileMDX(profile, mdx || '');
    console.log(`[mdx] Wrote profile → ${out}`);
    ok++
  } catch (e) {
    console.warn('[mdx] Skipping profile generation:', (e as Error).message);
  }

  try {
    const experiences = await fetchAllExperience();
    for (const experience of experiences) {
      const out = writeExperienceMDX(experience, '');
      console.log(`[mdx] Wrote experience ${experience.id} → ${out}`);
      ok++
    }
  } catch (e) {
    console.warn('[mdx] Skipping experience generation:', (e as Error).message);
  }

  console.log(`[mdx] Done. Generated ${ok} file(s).`);
}

main().catch((err) => {
  console.error('[mdx] FAILED:', err);
  process.exit(1);
});
