// Shared "chrome" strings (nav, footer, common CTAs). Rich page copy lives in
// each page component so the bilingual text sits next to its markup.
// House rule: no em dashes in any user-facing copy.

export const languages = ['en', 'es'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';

export const languageNames: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
};

export const ui = {
  en: {
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.patterns': 'Free patterns',
    'nav.brand': 'Brand',
    'nav.getApp': 'Get the app',
    'nav.skip': 'Skip to content',
    'nav.menu': 'Menu',
    'nav.theme': 'Toggle light and dark',
    'nav.lang': 'Cambiar a español',

    'cta.googlePlay': 'Get it on Google Play',
    'cta.freeTrial': 'Try Premium free for 7 days',
    'cta.seePricing': 'See pricing',
    'cta.freePatterns': 'Browse free patterns',

    'footer.tagline': 'The crochet app for makers who sell. Count, time and price every piece.',
    'footer.product': 'Product',
    'footer.company': 'More',
    'footer.legal': 'Legal',
    'footer.privacy': 'App privacy',
    'footer.privacySite': 'Website privacy',
    'footer.terms': 'Terms',
    'footer.developer': 'About the maker',
    'footer.etsy': 'NaredCraft on Etsy',
    'footer.coffee': 'Buy me a coffee',
    'footer.contact': 'Contact',
    'footer.rights': 'Made one row at a time.',
    'footer.by': 'by NaredCraft',
  },
  es: {
    'nav.features': 'Funciones',
    'nav.pricing': 'Precios',
    'nav.patterns': 'Patrones gratis',
    'nav.brand': 'Marca',
    'nav.getApp': 'Descarga la app',
    'nav.skip': 'Saltar al contenido',
    'nav.menu': 'Menú',
    'nav.theme': 'Cambiar claro y oscuro',
    'nav.lang': 'Switch to English',

    'cta.googlePlay': 'Descárgala en Google Play',
    'cta.freeTrial': 'Prueba Premium gratis 7 días',
    'cta.seePricing': 'Ver precios',
    'cta.freePatterns': 'Ver patrones gratis',

    'footer.tagline': 'La app de crochet para quien vende su trabajo. Cuenta, cronometra y cotiza cada pieza.',
    'footer.product': 'Producto',
    'footer.company': 'Más',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacidad de la app',
    'footer.privacySite': 'Privacidad del sitio',
    'footer.terms': 'Términos',
    'footer.developer': 'Sobre el maker',
    'footer.etsy': 'NaredCraft en Etsy',
    'footer.coffee': 'Invítame un café',
    'footer.contact': 'Contacto',
    'footer.rights': 'Hecha vuelta por vuelta.',
    'footer.by': 'por NaredCraft',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
