# algoro-dot-dev

This repository contains a personal portfolio and blog built with Astro, TailwindCSS v4, and Notion as the content source.
The site is statically generated and uses a custom design system with light/dark themes, a robust data layer for Notion, and clear routing for posts, tags, and other pages.

## Overview

The goal of this project is to create a fast, accessible, and beautiful personal website that can be updated through Notion.
Content is authored in Notion (posts and profile), then fetched and converted into MDX at build‑time. Tailwind v4 powers styling using design tokens defined in CSS variables, enabling full control over colors, typography, spacing, and dark‑mode support.

## Key Features

• Astro + MDX – Static site generation with support for Markdown and MDX posts.
• Notion integration – Posts and profile data are authored in Notion; a build script fetches pages via the Notion API and converts them into MDX files with local images and front‑matter.
• Content collections – Posts live in src/content/blog; a helper module exposes functions to list posts, fetch posts by slug, and list tags.
• Design system – Tailwind v4 with custom tokens for colors, spacing, radii, shadows, etc. Light/dark modes are toggled via a .dark class and persist user preference. Typography styles are customized for MDX content using a Prose wrapper.
• UI primitives – Reusable components (Button, Badge, Card, Container, Prose, ThemeToggle) implement consistent styling using the design system.
• Routing and pages – Clean URLs for home, blog index (with pagination), individual posts, tag listings, about page, RSS feed, sitemap, robots.txt, and custom 404. Dynamic routes for posts and tag archives are statically generated via getStaticPaths().
• SEO & metadata – a Centralized <Meta> component injects canonical URLs, Open Graph, and Twitter cards. Headless RSS and sitemap integrations emit feeds at /rss.xml and /sitemap-index.xml respectively.

## Getting Started

### Prerequisites

• Node.js ≥ 18 and pnpm.
• A Notion integration token and IDs for your post-database and profile page or database.
• Optional: @astrojs/mdx installed (already included in this project) for MDX support.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/algoro-dot-dev.git
cd algoro-dot-dev
pnpm install
```

Copy the example environment variables file and fill in your Notion secrets:

```bash
cp .env.example .env
# Edit .env with your NOTION_TOKEN, NOTION_DB_POSTS and NOTION_PROFILE_PAGE (or NOTION_DB_PROFILE)
```

### Fetching content and generating MDX

This project pulls content from Notion at build time. Two scripts exist:
• pnpm content:refresh – Fetch all posts and profile data and cache them as JSON. Used primarily for debugging.
• pnpm content:mdx – Fetch posts and profile, download images, convert Notion blocks into MDX, and write files into src/content/blog and src/content/profile. Use this before running astro dev or astro build to ensure MDX is up‑to‑date.

```bash
pnpm content:mdx
pnpm dev
```

The MDX generator requires a helper function loadChildren to fetch nested blocks (e.g., table rows) via the Notion API. See scripts/notion-to-mdx.ts for an example using notion.blocks.children.list.

### Running locally

```bash
pnpm dev    # Start development server at http://localhost:4321
```

### Building for production

```bash
pnpm build
pnpm preview   # Preview the static build
```

The production build outputs a fully static site under the dist directory. Deploy it to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

## Project Structure

```
src/
  components/      – UI primitives (Button, Badge, Card, Prose, ThemeToggle)
  content/
    blog/          – MDX posts generated from Notion
    profile/       – About page generated from Notion
  layouts/         – Shared layout component
  lib/
    content/       – Helpers to read posts and profile MDX
    notion/        – Notion client, mappers and conversion helpers
    mdx/           – Utilities to write MDX files
    fs/            – File-system helpers for cache and downloads
  pages/
    index.astro    – Home page
    blog/          – Blog index and pagination
    blog/[slug].astro – Individual post page
    tags/          – Tags listing and tag detail pages
    about.astro    – About/profile page
    rss.xml.ts     – RSS feed generator
    robots.txt.ts  – Robots file
    404.astro      – Custom 404 page
scripts/           – Build scripts (content refresh & Notion to MDX)

.env.example       – Example environment variables
README.md          – This file
LICENSE            – License information
```

## Environment Variables

Add the following variables to your .env file:

```
NOTION_TOKEN=      # Notion integration secret
NOTION_DB_POSTS=   # ID of the posts database (or data source ID if using Notion Data Sources API)
NOTION_PROFILE_PAGE= # ID of the profile page (or NOTION_DB_PROFILE for a profile database)
```

These are used by the Notion client to authenticate and query your databases.

## Notion Content Model

In Notion, create a database named Posts with at least the following properties:

| Property    | Type         | Description                   |
| ----------- | ------------ | ----------------------------- |
| Title       | Title        | Post title                    |
| Slug        | Text         | Unique slug (kebab-case)      |
| Status      | Select       | Draft or Published            |
| PublishedAt | Date         | Publication date              |
| Tags        | Multi-select | Category or tags              |
| Excerpt     | Text         | Optional summary              |
| Cover       | File         | Optional cover image          |
| Feature     | Checkbox     | Mark as featured on home page |

Draft posts remain unpublished until their status is set to Published. A profile page or database contains your personal information and long‑form biography; it is fetched and rendered in the /about page.

## Data Layer & Notion Integration

The project uses the official Notion SDK. The src/lib/notion directory defines:
• client.ts – Initializes the Notion client with the integration token and verifies environment variables.
• mappers.ts – Functions that map Notion page objects to TypeScript types and perform validation using Zod.
• fetchers.ts – Functions to fetch all posts, fetch a post by slug, fetch the profile, and fetch blocks for pages.
• blocks-to-mdx.ts – Converts Notion blocks into MDX strings, handling paragraphs, headings, lists, quotes, callouts, tables (with header synthesis), code blocks, images (downloaded locally), columns, toggles, and other block types. A loadChildren function is provided to fetch nested blocks using notion.blocks.children.list.

The scripts/notion-to-mdx.ts script orchestrates the content pipeline. It:

1. Reads all published posts from Notion.
2. Fetches top‑level blocks for each post.
3. Passes blocks and a loadChildren callback to blocksToMDX() to generate MDX content.
4. Downloads images into public/notion/<pageId>/.
5. Writes the MDX files into src/content/blog with front‑matter containing title, slug, date, tags, excerpt, cover, and reading time.
6. Generates a profile MDX file in src/content/profile.

## Design System & Tailwind v4

Tailwind v4 is configured via a single CSS file (src/styles/app.css) which imports Tailwind and defines theme tokens using @theme. Tokens include colors (--color-bg, --color-fg, etc.), radii, and shadows. Dark mode is implemented by overriding these tokens under :root.dark and toggled via a .dark class on <html>. A ThemeToggle component stores the user’s preference in localStorage and updates the class.

Typography and tables are styled through custom rules inside app.css. The Prose wrapper applies these styles to MDX content. Images use aspect‑ratio and object‑fit to maintain a consistent presentation, and optional attributes allow overriding cropping or containment.

## Routing & Site Structure

Routes are built with Astro’s file‑based routing and dynamic routes:
• / – Home page with a welcome section and recent posts.
• /blog – Blog index, lists posts with pagination.
• /blog/[slug] – Individual post pages, generated from MDX files.
• /tags – Lists all tags.
• /tags/[tag] – Shows posts tagged with a given tag.
• /about – About page rendered from profile MDX.
• /rss.xml – RSS feed generated from posts.
• /sitemap.xml and /sitemap-index.xml – Generated by @astrojs/sitemap integration.
• /robots.txt – Simple robots file pointing to the sitemap.
• /404 – Custom 404 page.

All dynamic pages are statically generated at build time via getStaticPaths(). Pagination divides posts into pages of a configurable size (default 10). Meta-tags and canonical URLs are injected via the Meta component.

## Contributing

Contributions are welcome! Please open issues or pull requests with improvements, bug fixes, or new features. Ensure that your changes do not break the build and follow the established coding style.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
