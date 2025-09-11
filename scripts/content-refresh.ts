import 'dotenv/config'
import { fetchAllPosts, fetchProfile } from '@lib/notion/fetchers.ts'
import { writeJSON } from '@lib/cache/fs-cache.ts'

async function main() {
  const includeDrafts = process.env.PREVIEW === '1' || process.env.REFRESH_CONTENT === 'true'

  console.log(`[content] Fetching Notion data (drafts: ${includeDrafts ? 'on' : 'off'})...`)

  const [posts, profile] = await Promise.all([
    fetchAllPosts({ includeDrafts }),
    fetchProfile(),
  ])

  const postsPath = writeJSON('posts.json', posts)
  const profilePath = writeJSON('profile.json', profile)

  console.log(`[content] Wrote ${posts.length} posts → ${postsPath}`)
  console.log(`[content] Wrote profile → ${profilePath}`)
}

main().catch((err) => {
  console.error('[content] FAILED:', err)
  process.exit(1)
})
