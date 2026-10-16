// Single source of truth for outbound links used across the site.
export const PLAY_STORE_ID = 'io.github.andreiito.roundcraft';
const PLAY_BASE = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;

/** Play Store link with an install-referrer UTM tag. */
export function playUrl(campaign: string): string {
  const referrer = encodeURIComponent(
    `utm_source=getroundcraft&utm_medium=web&utm_campaign=${campaign}`,
  );
  return `${PLAY_BASE}&referrer=${referrer}`;
}

export const ETSY_URL =
  'https://naredcraft.etsy.com?utm_source=getroundcraft&utm_medium=web&utm_campaign=footer';
export const COFFEE_URL = 'https://buymeacoffee.com/naredcraft';
export const EMAIL = 'naredcraft@gmail.com';

/** The lead-magnet section stays a single static URL in both languages. */
export const PATTERNS_URL = '/patterns/';

/** The free web Tapestry Studio. The landing is /studio/; the editor itself is
 *  the Vite bundle copied to public/studio/app/ by `npm run sync-studio`. */
export const STUDIO_APP_URL = '/studio/app/';

/** Flip to true together with VITE_SEND_TO_APP in tapestry-studio/.env.public,
 *  once a RoundCraft release that opens roundcraft://studio links is on Play.
 *  Until then the landing says "coming soon" instead of promising the hand-off. */
export const STUDIO_SEND_LIVE = false;
