// Build-time OG image generator. Renders two static PNGs from inline SVG via
// resvg: the 1200x630 social card and the 180x180 apple-touch-icon. Run once
// with `pnpm build:og` whenever the brand mark or copy changes.
//
// resvg ships its own font fallback; the SVGs below stick to platform-portable
// font stacks (Georgia/Helvetica/Menlo) so the output looks consistent on the
// machine this script is run from.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, 'public');

const COLOR_BG = '#08090b';
const COLOR_FG = '#e8e8e3';
const COLOR_FG_MUTED = '#d6d7d2';
const COLOR_FG_FADED = '#a3a7af';
const COLOR_ACCENT = '#6ba8d9';
const COLOR_BORDER = '#1c1f24';

function gridPattern(width, height) {
  return `
    <defs>
      <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
      </pattern>
      <radialGradient id="vignette" cx="50%" cy="0%" r="100%">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(4,6,10,0.7)"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grid)"/>
    <rect width="${width}" height="${height}" fill="url(#vignette)"/>
  `;
}

function ogSocialSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <rect width="1200" height="630" fill="${COLOR_BG}"/>
    ${gridPattern(1200, 630)}

    <!-- Top-left wordmark: algoro▍dev -->
    <g transform="translate(80, 100)">
      <text x="0" y="0" font-family="Menlo, Monaco, monospace" font-size="22" font-weight="500" fill="${COLOR_FG}">algoro</text>
      <rect x="92" y="-22" width="9" height="26" rx="1" fill="${COLOR_ACCENT}"/>
      <text x="105" y="0" font-family="Menlo, Monaco, monospace" font-size="22" font-weight="500" fill="${COLOR_FG}">dev</text>
    </g>

    <!-- Eyebrow -->
    <g transform="translate(80, 320)">
      <text x="0" y="0" font-family="Menlo, Monaco, monospace" font-size="16" font-weight="500" fill="${COLOR_FG_FADED}" letter-spacing="3">— SENIOR AI ENGINEER</text>
    </g>

    <!-- Big name -->
    <g transform="translate(80, 410)">
      <text x="0" y="0" font-family="Georgia, serif" font-size="84" font-weight="400" fill="${COLOR_FG}" letter-spacing="-2">Alejandro Gonzalez<tspan fill="${COLOR_ACCENT}" font-style="italic"> .</tspan></text>
    </g>

    <!-- Tagline -->
    <g transform="translate(80, 490)">
      <text x="0" y="0" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="400" fill="${COLOR_FG_MUTED}">Production AI systems that ship, scale, and don't break.</text>
    </g>

    <!-- Bottom-left URL -->
    <g transform="translate(80, 560)">
      <text x="0" y="0" font-family="Menlo, Monaco, monospace" font-size="16" fill="${COLOR_FG_FADED}">algoro.dev →</text>
    </g>

    <!-- Bottom-right divider line -->
    <line x1="80" y1="595" x2="1120" y2="595" stroke="${COLOR_BORDER}" stroke-width="1"/>
  </svg>`;
}

function appleTouchIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
    <rect width="180" height="180" fill="${COLOR_BG}"/>
    <rect x="74" y="36" width="32" height="108" rx="3" fill="${COLOR_ACCENT}"/>
  </svg>`;
}

function render(svg, outName) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
    background: COLOR_BG,
  });
  const png = resvg.render().asPng();
  const outPath = join(PUBLIC_DIR, outName);
  writeFileSync(outPath, png);
  const kb = (png.byteLength / 1024).toFixed(1);
  console.log(`[og] wrote ${outName} (${kb} KiB)`);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
render(ogSocialSvg(), 'og-default.png');
render(appleTouchIconSvg(), 'apple-touch-icon.png');
