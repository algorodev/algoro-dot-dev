# algoro-dot-dev

Personal portfolio built with Astro and TailwindCSS v4. Statically generated HTML with an on-demand serverless route powering a live RAG chat over the site's own MDX content. Authored under `src/content/`, deployed to Vercel.

## Overview

A fast, accessible, minimal personal site for a Senior AI Engineer. All content (bio, experience timeline, work case studies) lives as MDX in `src/content/`; pages are prerendered at build time. The home page embeds a working RAG chat demo over the same corpus, served from a Vercel function at `/api/chat`.

## Key Features

* **Astro 5 + MDX** – Static prerendering for content pages, on-demand SSR for `/api/chat` via the Vercel adapter.
* **Content collections** – Three Zod-typed collections (`profile`, `experience`, `work`) loaded via `astro/loaders` glob.
* **Live RAG demo** – Build-time embedding of all MDX content with `gemini-embedding-001` (dim 768), in-memory cosine top-5 retrieval, streaming chat through `gemini-2.5-flash` with inline `[N]` citations linked to the source page. Sliding-window rate limiting via Upstash Redis.
* **Design system** – Tailwind v4 configured through a single CSS file with `@theme` tokens (colors, radii, fonts, rail width). Dark-only palette: soft blue accent on cold blacks. Inter / JetBrains Mono / Instrument Serif loaded from Google Fonts.
* **UI primitives** – `Button`, `StackTag`, `StatBlock`, `WorkCard`, plus home and about composites.
* **Routing and pages** – Home, about, contact, work index, dynamic `work/[slug]`, custom 404, `robots.txt`, sitemap, `/api/chat`.
* **SEO & metadata** – Centralized `<Meta>` component injects canonical URL, Open Graph and Twitter cards. Sitemap emitted at `/sitemap-index.xml`.
* **Path aliases** – `@assets`, `@components`, `@content`, `@layouts`, `@lib`, `@pages`, `@styles`.

## Getting Started

### Prerequisites

* Node.js ≥ 22 (the build script uses `node --env-file-if-exists`, added in 22.9).
* pnpm.

### Installation

```bash
git clone https://github.com/algorodev/algoro-dot-dev.git
cd algoro-dot-dev
pnpm install
cp .env.example .env   # then fill in values — see "Environment" below
```

### Environment

| Variable | Required for | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Build-time embeddings + live `/api/chat` | Get one from [aistudio.google.com](https://aistudio.google.com). |
| `UPSTASH_REDIS_REST_URL` | Optional — rate limiting | Free tier at [upstash.com](https://upstash.com) is plenty for portfolio traffic. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional — rate limiting | Paired with the URL above. |

When the Upstash creds are unset the rate limiter is skipped (only safe for local dev). When `GEMINI_API_KEY` is unset, `pnpm build:rag-index` logs a warning and exits cleanly so local clones still build using the committed index. Vercel deploys should set all three.

### Scripts

```bash
pnpm dev              # Dev server at http://localhost:4321
pnpm build            # Rebuilds the RAG index, then runs astro build
pnpm build:rag-index  # Re-embeds MDX content into src/data/rag-index.json
pnpm preview          # Preview the production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm format           # Prettier write
```

The build outputs a Vercel-ready bundle under `.vercel/output/`: prerendered pages alongside an `_functions/_render.func` that serves the on-demand routes (`/api/chat` today).

## Project Structure

```
src/
  components/
    Nav.astro, Footer.astro, Section.astro, Meta.astro
    home/         – Hero, AboutSnippet, AiDemo, SelectedWork, TechGrid, TrustStrip, FooterCTA
    about/        – Timeline
    ui/           – Button, StackTag, StatBlock, WorkCard
  content/
    config.ts     – Zod schemas for the three collections
    profile/      – me.mdx (bio + frontmatter)
    experience/   – one MDX per role
    work/         – one MDX per case study
  data/
    rag-index.json – Build-time embedding index (generated, committed)
  layouts/
    BaseLayout.astro
  lib/content/    – Helpers: profile.ts, experience.ts, work.ts
  pages/
    index.astro, about.astro, contact.astro, 404.astro
    work/index.astro, work/[slug].astro
    api/
      chat.ts     – Streaming RAG chat (prerender = false)
      contact.ts  – Stub endpoint (see "Contact form" below)
    robots.txt.ts
  styles/
    global.css    – Tailwind v4 entry + @theme tokens + base layer
scripts/
  build-rag-index.mjs – Reads MDX → embeds with Gemini → writes rag-index.json
public/           – Static assets (favicon, profile image)
```

## Authoring Content

* **Profile** – Edit `src/content/profile/me.mdx`. Frontmatter: `name`, `role`, `raised`, `based`, `email`, `skills[]`, `image`.
* **Experience** – Add MDX files to `src/content/experience/`. Frontmatter: `title`, `location`, `start`, optional `organization` and `end` (omit `end` for current roles).
* **Work** – Add MDX files to `src/content/work/`. Frontmatter: `title`, `client`, `year`, `summary`, `tags[]`, `stack[]`, optional `metrics[]` (each `{ label, value, unit? }`), `featured`, `order`, `linkLabel`. Each entry renders at `/work/<slug>`.

Schemas are enforced at build time via Zod (`src/content/config.ts`); a missing or mistyped field will fail the build. After editing content, re-run `pnpm build:rag-index` (or `pnpm build`) to refresh the embeddings — the resulting `src/data/rag-index.json` is committed to the repo so deploys do not depend on a fresh embedding call.

## Design System & Tailwind v4

Tailwind v4 is configured through `src/styles/global.css`, which imports Tailwind and defines theme tokens with `@theme`. The site is dark-only: `html` uses `color-scheme: dark` and a fixed grid + radial vignette is painted via `body::before` / `body::after`. There is no light theme and no theme toggle.

Tokens cover colors (`--color-bg`, `--color-fg`, `--color-accent`, …), typography (`--font-sans`, `--font-mono`, `--font-serif`) and layout (`--rail-width` for the magazine rail+content layout used across sections).

## Live RAG demo

The `AiDemo` block on the home page is wired to `/api/chat`. The pipeline has three pieces:

1. **Build time** — `scripts/build-rag-index.mjs` reads every MDX file under `src/content/`, synthesises a header chunk from the frontmatter, splits bodies on `##` headings, and embeds everything in a single Gemini batch (`gemini-embedding-001`, `taskType: RETRIEVAL_DOCUMENT`, `outputDimensionality: 768`). Output is written to `src/data/rag-index.json` and committed.
2. **Request time** — `src/pages/api/chat.ts` (`prerender = false`) embeds the latest user message as `RETRIEVAL_QUERY`, runs cosine top-5 against the in-memory index, and streams `gemini-2.5-flash` back as Server-Sent Events. The system prompt locks generation to the retrieved sources and asks the model for inline `[N]` markers.
3. **Frontend** — A vanilla TypeScript island in `AiDemo.astro` parses the SSE stream and turns `[N]` markers into clickable citation pills linked to the source's page.

Rate limiting is sliding-window 10 req/min per IP via `@upstash/ratelimit`. When the Upstash creds are unset the limiter is skipped (local dev). Never deploy to production without them.

## Contact form

`src/pages/api/contact.ts` is currently a prerendered stub that returns `405` with a JSON message. The contact page falls back to a client-side handler that logs submissions to the browser console. The Vercel adapter is already in place (it powers `/api/chat`), so making contact live is now a matter of flipping `prerender = false`, replacing the GET stub with a POST handler, and forwarding the payload (e.g. via Resend).

## License

MIT — see `LICENSE.md`.
