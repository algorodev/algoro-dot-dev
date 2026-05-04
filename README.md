# algoro-dot-dev

Personal portfolio built with Astro and TailwindCSS v4. Statically generated, with a custom design system and light/dark themes.

## Overview

A fast, accessible, and minimal personal site. Profile and experience are authored as static MDX files under `src/content/` and rendered on the `/about` page.

## Key Features

* Astro + MDX – Static site generation with support for Markdown and MDX content.
* Content collections – Profile and experience live in `src/content/` and are read via small helpers in `src/lib/content/`.
* Design system – Tailwind v4 with custom tokens for colors, spacing, radii, shadows. Light/dark modes are toggled via a `.dark` class and persist user preference. Typography styles are customized for MDX content using a `Prose` wrapper.
* UI primitives – Reusable components (`Button`, `Badge`, `Card`, `Container`, `Prose`, `ToggleButton`).
* Routing and pages – Clean URLs for home, about, sitemap, robots.txt, and a custom 404. Dynamic data is rendered at build time.
* SEO & metadata – A centralized `<Meta>` component injects canonical URLs, Open Graph, and Twitter cards. Sitemap is emitted at `/sitemap-index.xml`.

## Getting Started

### Prerequisites

* Node.js ≥ 18 and pnpm.

### Installation

```bash
git clone https://github.com/algorodev/algoro-dot-dev.git
cd algoro-dot-dev
pnpm install
```

### Running locally

```bash
pnpm dev    # Start development server at http://localhost:4321
```

### Building for production

```bash
pnpm build
pnpm preview   # Preview the static build
```

The production build outputs a fully static site under `dist/`. Deploy it to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

## Project Structure

```
src/
  components/      – UI primitives (Button, Badge, Card, Prose, ToggleButton)
  content/
    profile/       – Profile MDX (bio + frontmatter)
    experience/    – Experience MDX entries (one per role)
  layouts/         – Shared layout component
  lib/
    content/       – Helpers to read profile and experience MDX
  pages/
    index.astro    – Home page
    about.astro    – About / profile page
    robots.txt.ts  – Robots file
    404.astro      – Custom 404 page
public/            – Static assets (favicon, profile image)
README.md          – This file
LICENSE            – License information
```

## Authoring Content

* Edit `src/content/profile/me.mdx` to update bio, role, location, skills, and the profile image path.
* Add or edit files in `src/content/experience/` to manage the experience timeline. Each entry needs `title`, `location`, `start`, and optionally `organization` and `end` (omit `end` for current roles).

## Design System & Tailwind v4

Tailwind v4 is configured via a single CSS file (`src/styles/global.css`) which imports Tailwind and defines theme tokens using `@theme`. Tokens include colors, radii, and shadows. Dark mode is implemented by overriding these tokens under `.dark` on `<html>`. A `ToggleButton` component stores the user’s preference in localStorage and updates the class.

Typography and tables are styled through custom rules inside the global stylesheet. The `Prose` wrapper applies these styles to MDX content.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
