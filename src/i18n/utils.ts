import { ui, defaultLang, languages, type Lang, type UIKey } from './ui';

/** Read the active language from a URL pathname (/es/... => 'es'). */
export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split('/');
  if ((languages as readonly string[]).includes(seg)) return seg as Lang;
  return defaultLang;
}

/** Translator bound to a language, with fallback to English. */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Prefix a root-relative path with the locale (en stays unprefixed).
 *  Under build.format:'preserve' the ES home is the directory index /es/. */
export function localizedPath(path: string, lang: Lang): string {
  const clean = '/' + path.replace(/^\/+/, '');
  if (lang === defaultLang) return clean;
  return clean === '/' ? '/es/' : `/es${clean}`;
}

/** Routes that are physically <dir>/index.html and so keep a trailing slash.
 *  Everything else under build.format:'preserve' is a real .html file, served
 *  without one. */
const DIR_INDEX = new Set(['/', '/es/', '/patterns/', '/es/patterns/']);

/** Match the physical build output. Astro.url reports a trailing slash on named
 *  routes, and `/patterns/paper-boat/` is a directory that does not exist, so any
 *  link built straight from Astro.url.pathname lands on a 404. */
export function canonicalizePath(pn: string): string {
  const withSlash = pn.endsWith('/') ? pn : pn + '/';
  return DIR_INDEX.has(withSlash) ? withSlash : pn.replace(/\/+$/, '');
}

/** Given the current pathname, return the equivalent path in the other language.
 *  Normalises on the way out, so callers can hand it Astro.url.pathname raw. */
export function alternatePath(pathname: string, target: Lang): string {
  // strip any existing locale prefix -> canonical english-style path
  let base = pathname.replace(/^\/es(?=\/|$)/, '');
  if (base === '') base = '/';
  return canonicalizePath(localizedPath(base, target));
}

export { languages, defaultLang };
export type { Lang };
