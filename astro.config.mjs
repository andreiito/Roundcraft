import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// getroundcraft.com — static marketing site + brand kit.
// build.format: 'preserve' mirrors src/pages structure: named pages become
// extensionless .html files (so app-linked /privacy-policy and /developer resolve
// with no redirect) while directory-index routes keep index.html (so the pinned
// lead-magnet URL /patterns/ keeps its trailing slash). The pattern detail page
// /patterns/abducted-cow.html stays a real .html file (matches index.json `page`
// and printed QR codes) and preserves the .rcpattern deep-link machinery.
// Do NOT add Astro `redirects` for trailing-slash pattern URLs: with
// build.format 'preserve', /patterns/foo/ and /patterns/foo both serialize to
// patterns/foo.html, so the redirect stub overwrites the real page and points at
// itself. That also destroys the .html URLs printed into QR codes. The
// trailing-slash recovery lives in src/pages/404.astro instead.
// Routes that are physically <dir>/index.html, so the server only serves them
// with a trailing slash and answers 301 without one. Mirror of DIR_INDEX in
// src/i18n/utils.ts; keep the two in step. The config cannot import from src
// because Astro loads this file before the TS pipeline exists.
const DIR_INDEX = new Set(['/', '/es/', '/patterns/', '/es/patterns/']);

/** @astrojs/sitemap strips the trailing slash off every entry, which turns the
 *  four directory-index routes into 301s. Search Console then reports them as
 *  "Page with redirect" and the hreflang annotations point at redirects too, so
 *  both the <loc> and every xhtml:link href get normalised here. */
function withCanonicalSlash(rawUrl) {
  const url = new URL(rawUrl);
  const slashed = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (!DIR_INDEX.has(slashed)) return rawUrl;
  url.pathname = slashed;
  return url.href;
}

export default defineConfig({
  site: 'https://getroundcraft.com',
  // inlineStylesheets 'always': the shared bundle is ~18 KB and was a
  // render-blocking request, so on a slow connection the page painted as
  // unstyled HTML and then reflowed once the CSS landed. Measured at CLS 0.2445
  // on Slow 3G, dominated by <body> losing the UA default 8px margin five
  // seconds in. Astro's 'auto' default only inlines under 4 KB.
  // The trade: ~19 KB more HTML per page and no CSS reuse across pages. Worth it
  // because nearly every visitor arrives from Ravelry on a first visit, where
  // one less round trip beats a cache that will not be reused.
  build: { format: 'preserve', inlineStylesheets: 'always' },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      serialize(item) {
        item.url = withCanonicalSlash(item.url);
        if (item.links) {
          item.links = item.links.map((l) => ({ ...l, url: withCanonicalSlash(l.url) }));
        }
        return item;
      },
    }),
  ],
});
