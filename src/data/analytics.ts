// Analytics configuration. Both are off until an id is pasted in, and the site
// ships nothing at all while they are empty: no beacon, no consent banner, no
// third-party request.
//
// ─────────────────────────────────────────────────────────────────────────────
// What each one can actually answer
//
// Cloudflare Web Analytics: how many people came and from where. Cookieless, so
//   no consent banner. It has no event model at all, so it cannot tell you that
//   someone downloaded a PDF or tapped "Open in RoundCraft".
//
// GA4: the funnel. Every action below becomes an event, so you can see how many
//   visitors reach a pattern, how many download it, and how many tap through to
//   the app. It sets cookies, so an audience in Spain needs a consent banner
//   before it may load. This file does not add one.
//
// Neither is needed to answer "did the free patterns cause installs". Every
// Play Store link on this site carries an install-referrer UTM, so that lands in
// Play Console under Acquisition reports on its own.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cloudflare Web Analytics beacon token.
 *
 * Get it: dash.cloudflare.com → Analytics & Logs → Web Analytics → Add a site →
 * enter getroundcraft.com → it shows a snippet containing
 * `data-cf-beacon='{"token": "…"}'`. Paste the token here.
 *
 * The domain does not have to use Cloudflare DNS for this to work, and the
 * token is meant to be public: it ends up in the page source either way.
 */
export const CF_BEACON_TOKEN = '';

/**
 * GA4 measurement id, the `G-XXXXXXXXXX` string.
 *
 * Get it: analytics.google.com → Admin → Create property → name it "RoundCraft"
 * → Web data stream for https://getroundcraft.com → copy the Measurement ID.
 *
 * Leave empty unless you also add a consent banner. It sets cookies.
 */
export const GA4_ID = '';

/**
 * The actions worth counting. Any element with `data-track="<name>"` reports a
 * click, so tracking a new one is an attribute rather than a code change.
 *
 * Kept as a list so the names stay stable: a renamed event silently starts a new
 * series in GA4 and the old one just stops, which looks like a traffic collapse.
 */
export const TRACKED = [
  'pdf_download',
  'rcpattern_download',
  'open_in_app',
  'play_store',
  'pattern_view',
] as const;

export const analyticsEnabled = Boolean(CF_BEACON_TOKEN || GA4_ID);
