import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// getroundcraft.com — static marketing site + brand kit.
// build.format: 'preserve' mirrors src/pages structure: named pages become
// extensionless .html files (so app-linked /privacy-policy and /developer resolve
// with no redirect) while directory-index routes keep index.html (so the pinned
// lead-magnet URL /patterns/ keeps its trailing slash). The pattern detail page
// /patterns/abducted-cow.html stays a real .html file (matches index.json `page`
// and printed QR codes) and preserves the .rcpattern deep-link machinery.
export default defineConfig({
  site: 'https://getroundcraft.com',
  build: { format: 'preserve' },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
    }),
  ],
});
