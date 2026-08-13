import type { Lang } from '../i18n/utils';

import tagsJson from './tags.json';

/** Tag vocabulary for the catalog filter, shared with scripts/add-pattern.mjs
 *  so a tag cannot be spelled one way in the data and another in the UI. Add a
 *  tag to tags.json before using it: the filter chips are derived from the tags
 *  actually in use, so an unused tag never shows up as a dead-end chip. */
export const TAGS: Record<string, { en: string; es: string }> = tagsJson;

export type TagId = keyof typeof tagsJson;

/**
 * What a pattern actually has to say for itself. One JSON file per pattern in
 * ./patterns/, written by scripts/add-pattern.mjs and then filled in by hand.
 *
 * Only the fields that need a person are here. Everything else about a pattern
 * follows from its slug and its dimensions, and repeating derivable values per
 * pattern is how they drift: a stitch count that no longer matches the chart, a
 * licence line that says something different on one page.
 */
interface PatternSource {
  slug: string;
  /** Display name. Shorter than the name inside the .rcpattern, which carries
   *  the publisher because the app uses it as the imported project's name. */
  name: string;
  width: number;
  height: number;
  colors: number;
  publishedAt: string;
  tags: TagId[];
  locales: Record<Lang, { seoDesc: string; about: string; bullets: string[] }>;
}

interface PatternLocale {
  seoTitle: string;
  seoDesc: string;
  subtitle: string;
  aboutTitle: string;
  about: string;
  bullets: string[];
  importNote: string;
  license: string;
  appPitch: string;
}

export interface Pattern {
  slug: string;
  name: string;
  width: number;
  height: number;
  colors: number;
  publishedAt: string;
  preview: string;
  ogImage: string;
  pdf: { en: string; es: string };
  rcpattern: string;
  /** Absolute URL on the andreiito.github.io host, which GitHub redirects to
   *  getroundcraft.com. The app validates this string against its import
   *  allow-list before fetching, and the version on the Play Store today only
   *  allows the github.io prefix, so pointing this at getroundcraft.com would
   *  break importing for everyone who has not updated.
   *
   *  The app source already accepts both hosts (ALLOWED_IMPORT_URL_PREFIXES in
   *  src/features/tapestry/importPattern.ts). Switch IMPORT_HOST below to
   *  https://getroundcraft.com once that release has been out long enough, and
   *  drop the redirect hop. */
  deepLinkTarget: string;
  tags: TagId[];
  meta: { en: string; es: string };
  locales: Record<Lang, PatternLocale>;
}

const IMPORT_HOST = 'https://andreiito.github.io/Roundcraft';

/** Boilerplate that is the same on every pattern page, so it is written once. */
const SHARED = {
  en: {
    aboutTitle: 'About this pattern',
    importNote:
      'Import it in RoundCraft (v1.0.15+): Tools, then Tapestry, then Import. Follow the chart stitch by stitch with the built-in counter.',
    license:
      'Personal use. You may sell the finished items. Please do not redistribute the PDF. This pattern is always free on this page.',
    appPitch:
      'RoundCraft is the professional crochet app. Smart row counters, a project timer and a quote calculator to price your finished pieces, plus a tapestry mode to follow this pattern stitch by stitch.',
    seoTitle: (name: string) => `${name} — Free Tapestry Crochet Pattern | RoundCraft`,
    subtitle: (p: PatternSource) =>
      `${p.width} × ${p.height} · ${(p.width * p.height).toLocaleString('en-US')} stitches · ${p.colors} colors · by NaredCraft`,
    meta: (p: PatternSource) => `${p.width} × ${p.height} · ${p.colors} colors · tapestry crochet`,
  },
  es: {
    aboutTitle: 'Sobre este patrón',
    importNote:
      'Impórtalo en RoundCraft (v1.0.15+): Herramientas, luego Tapestry, luego Importar. Sigue el chart punto por punto con el contador integrado.',
    license:
      'Uso personal. Puedes vender las piezas terminadas. No redistribuyas el PDF. Este patrón es siempre gratuito en esta página.',
    appPitch:
      'RoundCraft es la app profesional para tejer. Contadores de vueltas inteligentes, cronómetro de proyecto y calculadora para cotizar tus piezas, con modo tapestry para seguir este patrón punto por punto.',
    seoTitle: (name: string) => `${name} — Patrón de Tapestry Crochet Gratis | RoundCraft`,
    subtitle: (p: PatternSource) =>
      `${p.width} × ${p.height} · ${(p.width * p.height).toLocaleString('es-MX')} puntos · ${p.colors} colores · por NaredCraft`,
    meta: (p: PatternSource) => `${p.width} × ${p.height} · ${p.colors} colores · tapestry crochet`,
  },
} as const;

function expand(src: PatternSource): Pattern {
  const { slug } = src;
  // A stub written by add-pattern.mjs and never filled in would publish a page
  // with a blank description, so the build stops instead.
  for (const lang of ['en', 'es'] as const) {
    const l = src.locales?.[lang];
    const missing = !l?.about?.trim() || !l?.seoDesc?.trim() || !l?.bullets?.length;
    if (missing) {
      throw new Error(
        `src/data/patterns/${slug}.json is missing ${lang} copy (seoDesc, about, bullets). ` +
        `Fill it in, or delete the file to unpublish the pattern.`,
      );
    }
  }
  const locales = {} as Record<Lang, PatternLocale>;
  for (const lang of ['en', 'es'] as const) {
    const shared = SHARED[lang];
    locales[lang] = {
      seoTitle: shared.seoTitle(src.name),
      seoDesc: src.locales[lang].seoDesc,
      subtitle: shared.subtitle(src),
      aboutTitle: shared.aboutTitle,
      about: src.locales[lang].about,
      bullets: src.locales[lang].bullets,
      importNote: shared.importNote,
      license: shared.license,
      appPitch: shared.appPitch,
    };
  }
  return {
    ...src,
    preview: `/patterns/assets/${slug}-preview.png`,
    ogImage: `/patterns/assets/${slug}-pin-photo.png`,
    pdf: { en: `/patterns/assets/${slug}-en.pdf`, es: `/patterns/assets/${slug}-es.pdf` },
    rcpattern: `/patterns/assets/${slug}.rcpattern`,
    deepLinkTarget: `${IMPORT_HOST}/patterns/assets/${slug}.rcpattern`,
    meta: { en: SHARED.en.meta(src), es: SHARED.es.meta(src) },
    locales,
  };
}

// Every JSON file in ./patterns is a published pattern. Adding one is the whole
// registration step; nothing has to be imported or listed by hand.
const sources = Object.values(
  import.meta.glob<{ default: PatternSource }>('./patterns/*.json', { eager: true }),
).map((m) => m.default);

/** Oldest first: the catalog reads in publication order, so page 1 stays the
 *  same page it was yesterday and a new pattern lands at the end instead of
 *  shifting everything down. Ties break on slug so the order is deterministic
 *  when several patterns share a publish date. */
export const patterns: Pattern[] = sources
  .sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : a.publishedAt > b.publishedAt ? 1 : a.slug.localeCompare(b.slug)))
  .map(expand);

/** Tags in use across the published patterns, in TAGS declaration order, so the
 *  filter chips stay stable rather than reordering as patterns are added. */
export function activeTags(list: Pattern[]): TagId[] {
  const used = new Set(list.flatMap((p) => p.tags));
  return (Object.keys(tagsJson) as TagId[]).filter((id) => used.has(id));
}

export const getPattern = (slug: string) => patterns.find((p) => p.slug === slug);

/** Filename a download lands under. The assets on disk are named by slug, which
 *  tells a person nothing once the file is sitting in their Downloads folder
 *  next to forty other PDFs. The brand goes first so every RoundCraft pattern
 *  files together alphabetically.
 *
 *  Both PDFs of a pattern would otherwise collide and become "… (1).pdf", so
 *  the language is part of the name rather than a guess the browser makes. */
export function downloadName(pattern: Pattern, kind: 'pdf-en' | 'pdf-es' | 'rcpattern'): string {
  const base = `RoundCraft free pattern - ${pattern.name}`;
  if (kind === 'rcpattern') return `${base}.rcpattern`;
  return `${base} (${kind === 'pdf-en' ? 'EN' : 'ES'}).pdf`;
}
