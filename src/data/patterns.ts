import type { Lang } from '../i18n/utils';

/** Tag vocabulary for the catalog filter. Add a tag here before using it on a
 *  pattern; the filter chips are derived from the tags actually in use, so an
 *  unused tag never shows up as a dead-end chip. */
export const TAGS = {
  tapestry: { en: 'Tapestry', es: 'Tapestry' },
  amigurumi: { en: 'Amigurumi', es: 'Amigurumi' },
  animals: { en: 'Animals', es: 'Animales' },
  space: { en: 'Space', es: 'Espacio' },
  holiday: { en: 'Holiday', es: 'Fiestas' },
  geometric: { en: 'Geometric', es: 'Geométrico' },
  beginner: { en: 'Beginner', es: 'Principiante' },
  intermediate: { en: 'Intermediate', es: 'Intermedio' },
  advanced: { en: 'Advanced', es: 'Avanzado' },
} as const;

export type TagId = keyof typeof TAGS;

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
   *  src/features/tapestry/importPattern.ts). Switch this to
   *  https://getroundcraft.com/patterns/assets/… once that release has been
   *  out long enough, and drop the redirect hop. */
  deepLinkTarget: string;
  tags: TagId[];
  meta: { en: string; es: string };
  locales: Record<Lang, PatternLocale>;
}

/** Tags in use across the published patterns, in TAGS declaration order, so the
 *  filter chips stay stable rather than reordering as patterns are added. */
export function activeTags(list: Pattern[]): TagId[] {
  const used = new Set(list.flatMap((p) => p.tags));
  return (Object.keys(TAGS) as TagId[]).filter((id) => used.has(id));
}

export const patterns: Pattern[] = [
  {
    slug: 'abducted-cow',
    name: 'Abducted Cow',
    width: 39,
    height: 66,
    colors: 16,
    preview: '/patterns/assets/abducted-cow-preview.png',
    ogImage: '/patterns/assets/abducted-cow-pin-photo.png',
    pdf: { en: '/patterns/assets/abducted-cow-en.pdf', es: '/patterns/assets/abducted-cow-es.pdf' },
    rcpattern: '/patterns/assets/abducted-cow.rcpattern',
    deepLinkTarget: 'https://andreiito.github.io/Roundcraft/patterns/assets/abducted-cow.rcpattern',
    tags: ['tapestry', 'animals', 'space', 'intermediate'],
    meta: { en: '39 × 66 · 16 colors · tapestry crochet', es: '39 × 66 · 16 colores · tapestry crochet' },
    locales: {
      en: {
        seoTitle: 'Abducted Cow — Free Tapestry Crochet Pattern | RoundCraft',
        seoDesc:
          'Free tapestry crochet pattern: a UFO beaming up a very surprised cow. 39 by 66 stitches, 16 colors. Full-color chart plus a written row-by-row pattern, printable PDF in English and Spanish.',
        subtitle: '39 × 66 · 2,574 stitches · 16 colors · by NaredCraft',
        aboutTitle: 'About this pattern',
        about:
          'A night scene in tapestry crochet: a flying saucer beams up a very surprised cow while the farmhouse sleeps. Worked flat in single crochet colorwork, great for wall hangings, tote bags and blanket panels.',
        bullets: [
          'Full-color symbol chart, readable even printed in black and white',
          'Written row-by-row pattern with color runs and RS/WS sides',
          'Yarn color legend with stitch counts per color',
          'Printable PDF, US Letter',
        ],
        importNote:
          'Import it in RoundCraft (v1.0.15+): Tools, then Tapestry, then Import. Follow the chart stitch by stitch with the built-in counter.',
        license:
          'Personal use. You may sell the finished items. Please do not redistribute the PDF. This pattern is always free on this page.',
        appPitch:
          'RoundCraft is the professional crochet app. Smart row counters, a project timer and a quote calculator to price your finished pieces, plus a tapestry mode to follow this pattern stitch by stitch.',
      },
      es: {
        seoTitle: 'Abducted Cow — Patrón de Tapestry Crochet Gratis | RoundCraft',
        seoDesc:
          'Patrón de tapestry crochet gratis: un OVNI abduce a una vaca muy sorprendida. 39 por 66 puntos, 16 colores. Chart a todo color y patrón escrito fila a fila, PDF imprimible en inglés y español.',
        subtitle: '39 × 66 · 2,574 puntos · 16 colores · por NaredCraft',
        aboutTitle: 'Sobre este patrón',
        about:
          'Una escena nocturna en tapestry crochet: un platillo volador abduce a una vaca muy sorprendida mientras la granja duerme. Se teje plano en punto bajo con cambio de color, ideal para tapices, bolsas y paneles de manta.',
        bullets: [
          'Chart de símbolos a todo color, legible incluso impreso en blanco y negro',
          'Patrón escrito fila a fila con tramos de color y lados RS/WS',
          'Leyenda de colores con conteo de puntos por color',
          'PDF listo para imprimir, tamaño carta',
        ],
        importNote:
          'Impórtalo en RoundCraft (v1.0.15+): Herramientas, luego Tapestry, luego Importar. Sigue el chart punto por punto con el contador integrado.',
        license:
          'Uso personal. Puedes vender las piezas terminadas. No redistribuyas el PDF. Este patrón es siempre gratuito en esta página.',
        appPitch:
          'RoundCraft es la app profesional para tejer. Contadores de vueltas inteligentes, cronómetro de proyecto y calculadora para cotizar tus piezas, con modo tapestry para seguir este patrón punto por punto.',
      },
    },
  },
];

export const getPattern = (slug: string) => patterns.find((p) => p.slug === slug);
