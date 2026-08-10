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

/** Given the current pathname, return the equivalent path in the other language. */
export function alternatePath(pathname: string, target: Lang): string {
  // strip any existing locale prefix -> canonical english-style path
  let base = pathname.replace(/^\/es(?=\/|$)/, '');
  if (base === '') base = '/';
  return localizedPath(base, target);
}

export { languages, defaultLang };
export type { Lang };
