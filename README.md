# algoro-dot-dev

Personal portfolio built with Astro and TailwindCSS v4. Statically generated, dark-only, with a custom design system. Profile, experience and work case studies are authored as MDX files under `src/content/`.

## Overview

A fast, accessible, minimal personal site for a Senior AI Engineer. All content (bio, experience timeline, work case studies) lives as MDX in `src/content/` and is rendered at build time.

## Key Features

* Astro 5 + MDX – Static site generation with Markdown and MDX content.
* Content collections – Three Zod-typed collections (`profile`, `experience`, `work`) loaded via `astro/loaders` glob.
* Design system – Tailwind v4 configured through a single CSS file with `@theme` tokens (colors, radii, fonts, rail width). Dark-only palette: soft blue accent on cold blacks. Inter / JetBrains Mono / Instrument Serif loaded from Google Fonts.
* UI primitives – `Button`, `StackTag`, `StatBlock`, `WorkCard`, plus home/about composites.
* Routing and pages – Home, about, contact, work index, dynamic `work/[slug]`, custom 404, `robots.txt`, sitemap.
* SEO & metadata – Centralized `<Meta>` component injects canonical URL, Open Graph and Twitter cards. Sitemap emitted at `/sitemap-index.xml`.
* Path aliases – `@assets`, `@components`, `@content`, `@layouts`, `@lib`, `@pages`, `@styles`.

## Getting Started

### Prerequisites

* Node.js ≥ 18 and pnpm.

### Installation

```bash
git clone https://github.com/algorodev/algoro-dot-dev.git
cd algoro-dot-dev
pnpm install
```

### Scripts

```bash
pnpm dev        # Dev server at http://localhost:4321
pnpm build      # Static build to dist/
pnpm preview    # Preview the production build
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm format     # Prettier write
```

The production build outputs a fully static site under `dist/` and can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).

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
  layouts/
    BaseLayout.astro
  lib/content/    – Helpers: profile.ts, experience.ts, work.ts
  pages/
    index.astro, about.astro, contact.astro, 404.astro
    work/index.astro, work/[slug].astro
    api/contact.ts   – Stub endpoint (see "Contact form" below)
    robots.txt.ts
  styles/
    global.css    – Tailwind v4 entry + @theme tokens + base layer
public/           – Static assets (favicon, profile image)
```

## Authoring Content

* **Profile** – Edit `src/content/profile/me.mdx`. Frontmatter: `name`, `role`, `raised`, `based`, `email`, `skills[]`, `image`.
* **Experience** – Add MDX files to `src/content/experience/`. Frontmatter: `title`, `location`, `start`, optional `organization` and `end` (omit `end` for current roles).
* **Work** – Add MDX files to `src/content/work/`. Frontmatter: `title`, `client`, `year`, `summary`, `tags[]`, `stack[]`, optional `metrics[]` (each `{ label, value, unit? }`), `featured`, `order`, `linkLabel`. Each entry renders at `/work/<slug>`.

Schemas are enforced at build time via Zod (`src/content/config.ts`); a missing or mistyped field will fail the build.

## Design System & Tailwind v4

Tailwind v4 is configured through `src/styles/global.css`, which imports Tailwind and defines theme tokens with `@theme`. The site is dark-only: `html` uses `color-scheme: dark` and a fixed grid + radial vignette is painted via `body::before` / `body::after`. There is no light theme and no theme toggle.

Tokens cover colors (`--color-bg`, `--color-fg`, `--color-accent`, …), typography (`--font-sans`, `--font-mono`, `--font-serif`) and layout (`--rail-width` for the magazine rail+content layout used across sections).

## Contact form

`src/pages/api/contact.ts` is currently a prerendered stub that returns `405` with a JSON message. The contact page falls back to a client-side handler that logs submissions to the browser console. To make it live, add an SSR/hybrid adapter (e.g. `@astrojs/vercel` or `@astrojs/node`), set `prerender = false`, and replace the GET stub with a POST that validates and forwards the payload (e.g. via Resend).

## License

MIT — see `LICENSE.md`.
