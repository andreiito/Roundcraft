// The rules for authored pattern copy, in one place.
//
// Imported by `expand()` in patterns.ts, which throws on anything HARD, and by
// scripts/check-copy.mjs, which reports the SOFT ones. Two consumers, one
// source: the standard already drifted once because it lived in a commit
// message, and a rule written down twice drifts the same way.
//
// Only countable things are hard. Tone is not enforceable without false
// positives, and a build that fails on style gets worked around rather than
// obeyed, so tone belongs to the pattern-copy skill and to the soft report.

export const LIMITS = {
  // Truncated in the result past 160; wasting the slot under 120. It is also
  // the og: and twitter: description, so it is the only string that reaches
  // three surfaces at once.
  seoDesc: { min: 120, max: 160 },
  // The 2026-08-28 standard. Length is the enforceable proxy for the real
  // rule, which is that the paragraph stays three movements long.
  about: { min: 200, max: 400 },
};

/** Substrings that are always a rule break, in either language. Kept short and
 *  unambiguous on purpose: a deny-list that guesses produces false positives,
 *  and a gate people distrust is a gate people disable. */
export const BANNED = [
  // cross-pattern comparison
  'in the collection', 'on this site', 'on the site', 'in the catalog',
  'in the catalogue', 'other patterns',
  'de la colección', 'del catálogo', 'otros patrones',
  // the author, in any person
  'the designer', 'the author', 'la diseñadora', 'el diseñador',
  // the app has its own block on the page, written once in SHARED.appPitch
  'RoundCraft',
];

/** Words that name a destination: the third movement, and the one that goes
 *  missing first. Not exhaustive and not a gate, just enough to notice. */
const DESTINATION = {
  en: ['cushion', 'pillow', 'tote', 'bag', 'wall', 'blanket', 'square', 'panel',
       'bookmark', 'frame', 'framed', 'gift', 'coaster', 'pouch', 'hanging', 'pocket',
       'door', 'book', 'hang', 'hall', 'entryway', 'ornament', 'patch', 'case',
       'runner', 'table', 'marker', 'nursery', 'studio'],
  es: ['cojín', 'bolsa', 'pared', 'manta', 'cuadro', 'panel', 'separador',
       'regalo', 'regalar', 'portavasos', 'posavasos', 'monedero', 'tapiz',
       'bolsillo', 'funda', 'puerta', 'libro', 'colgar', 'colgado', 'cuelga',
       'recibidor', 'mesa', 'cuarto', 'marco', 'enmarcado', 'adorno', 'parche',
       'estuche', 'etiqueta'],
};

/** Tells that a sentence is explaining the design rather than the object.
 *  High precision, low recall on purpose. */
const JARGON = [
  'legible', 'reads as', 'notan', 'silhouette carries', 'colour boundary',
  'color boundary', 'per row is', 'grid', 'artefact', 'artifact',
  'lee como', 'legibilidad', 'cuadrícula', 'frontera de color',
];

const EM_DASH = /[—–]/;

function fields(locale) {
  return [['seoDesc', locale.seoDesc], ['about', locale.about],
          ...locale.bullets.map((b, i) => [`bullets[${i}]`, b])];
}

/** Objective failures. The build refuses to produce a page with any of these. */
export function hardFailures(lang, locale) {
  const out = [];
  for (const [name, limit] of Object.entries(LIMITS)) {
    const n = (locale[name] || '').length;
    if (n < limit.min || n > limit.max) {
      out.push(`${lang}.${name} is ${n} characters, outside ${limit.min}-${limit.max}`);
    }
  }
  for (const [where, text] of fields(locale)) {
    if (EM_DASH.test(text)) out.push(`${lang}.${where} contains an em or en dash`);
    for (const phrase of BANNED) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        out.push(`${lang}.${where} contains the banned phrase "${phrase}"`);
      }
    }
  }
  return out;
}

/** Advisory. Reported by the script, never enforced by the build. */
export function softWarnings(lang, locale) {
  const out = [];
  const about = (locale.about || '').toLowerCase();
  if (!DESTINATION[lang].some((w) => about.includes(w))) {
    out.push(`${lang}.about names no destination: say what the finished piece becomes`);
  }
  for (const tell of JARGON) {
    if (about.includes(tell.toLowerCase())) {
      out.push(`${lang}.about reads as a design note near "${tell}"`);
    }
  }
  return out;
}

/** Share of vocabulary two texts have in common, 0 to 1. Two descriptions over
 *  0.45 are competing for the same query instead of covering two. */
export function vocabularyOverlap(a, b) {
  const words = (s) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const A = words(a), B = words(b);
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / new Set([...A, ...B]).size;
}
