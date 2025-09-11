import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.algoro.dev',
  output: 'static',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  prefetch: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@assets': new URL('./src/assets', import.meta.url).pathname,
        '@components': new URL('./src/components', import.meta.url).pathname,
        '@content': new URL('./src/content', import.meta.url).pathname,
        '@layouts': new URL('./src/layouts', import.meta.url).pathname,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
        '@pages': new URL('./src/pages', import.meta.url).pathname,
        '@styles': new URL('./src/styles', import.meta.url).pathname,
      },
    },
  },
});
