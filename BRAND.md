# RoundCraft Brand Kit

The identity for **RoundCraft**, the crochet app for makers who sell, published by **NaredCraft**. This is the single source of truth for the website and any future marketing. The live version is at [/brand](https://getroundcraft.com/brand).

House rule for all copy: **no em dashes**. Use periods, commas or parentheses. Warm and professional, informal "tú" in Spanish, verb-first, no hype words.

---

## Identity: Warm Artisan

A boutique yarn atelier meeting a modern software product. Tactile, warm and confident, never cutesy. Terracotta leads, on warm ivory, with sage as a quiet second and espresso as the ink. Behind everything sits a faint **colorwork grid** texture borrowed from the app's tapestry mode. The mark itself is always the app's own hand-drawn yarn ball, never a substitute shape.

The app UI already uses a terracotta accent, so the web and the app read as one brand. Note the current Play Store icon is teal; a future app release should align it to this terracotta identity.

---

## Color

Tokens live in `src/styles/tokens.css`. Dominant + accent, never a timid even spread.

### Light
| Role | Token | Hex |
|---|---|---|
| Page background | `--bg` | `#FBF7EF` |
| Section wash | `--bg-tint` | `#F5ECDC` |
| Card surface | `--surface` | `#FFFFFF` |
| Primary text | `--ink` | `#241C15` |
| Secondary text | `--ink-soft` | `#574636` |
| Brand accent | `--clay` | `#C0502B` |
| Accent (text/buttons) | `--clay-deep` | `#973919` |
| Secondary | `--sage` / `--sage-text` | `#7C8A5A` / `#566139` |
| Hairline | `--line` | `#E7D8BE` |

### Dark
Warm espresso base, never pure black. Background `#17110C`, surfaces `#221A12`, ink `#F4ECDD`, accent lightened to `#E9744B`.

**Usage:** clay is the single confident accent (CTAs, key numbers, the mark). Sage is decorative and for success/secondary. Use `--clay-deep` behind white text so contrast meets WCAG AA. Ochre only for tiny highlights.

---

## Typography

Self-hosted variable fonts (no CDN, no generic system stack).

- **Display / headings: Fraunces Variable.** High-contrast, warm serif with character. Tight leading, slight negative tracking.
- **Body / UI: Hanken Grotesk Variable.** Clean humanist grotesque, 1.6 line-height.
- **Numerals (prices, counters): monospace** with tabular figures (`--font-mono`).

Never Inter, Roboto, Arial or plain system fonts.

---

## Logo and mark

- **Mark:** the app's hand-drawn yarn-ball mark with sparkles (teal line art). File: `public/img/logo-mark.png`. Component: `src/components/Logo.astro` (mark + "RoundCraft" set in Fraunces, used in the header).
- **Full lockup:** `public/img/logo-lockup.png`, the app's own logo with the handwritten "RoundCraft" wordmark under the ball, background keyed out so it sits on light and dark. Use it wherever the brand signs off: footer, final CTA, 404, brand page. Never rebuild this wordmark in a font.
- **App icon / favicon:** the yarn-ball app icon (`public/icon.png`), also used for the browser favicon and PWA icons.
- **Wordmark:** in compact spaces the mark pairs with "RoundCraft" set in Fraunces; the full app lockup keeps the original handwritten wordmark.
- **Endorsement:** "by NaredCraft" in the footer. The NaredCraft watercolor logo (`public/img/naredcraft-logo.png`) represents the parent craft brand.
- **Do:** keep clear space around the mark; keep it consistent in light and dark.
- **Do not:** recolor the mark, stretch it, or add effects.

---

## Iconography

Feature and tool tiles use the app's real illustrated icons (warm terracotta/cream style, `public/img/app-icons/`, via `src/components/AppIcon.astro`) so the site and app share one visual language. Plain UI affordances (arrows, checks, chevrons) use a small consistent line set (`src/components/Icon.astro`). **Never emoji as icons.**

## Screenshots

All product imagery is a real capture from the app on a Pixel 9 Pro, not a mockup: `public/img/screens/` (projects, counters, timer, quote, quote-detailed, share-craft, share-quote, tools, colors). They are cropped to drop the Android status bar and gesture pill, exported at 720 × 1494, and always shown inside `src/components/DeviceFrame.astro`. When the app UI changes, recapture rather than retouch.

**Note on the screenshot data:** the captures use the app's demo project ("Sample scarf") and real numbers produced by the calculator. Never edit prices or totals into a screenshot by hand.

---

## Space, radius, motion

- Spacing and radius scales are tokens (`--sp-*`, `--r-*`). Vary radius intentionally per component rather than one uniform value.
- Warm-tinted shadows only, never neutral gray.
- Motion is eased and purposeful (hover lifts, one staggered load, a count-up on the price). Everything respects `prefers-reduced-motion`.

---

## Voice and tone

- Audience: crocheters and knitters who sell their work.
- Confident, warm, concrete. Short verb-first sentences.
- Banned: hype words, "unlock / desbloquear", emoji-bombing, and **em dashes**.
- Do not call RoundCraft a "row counter" or "freemium app". Lead with the promise: *Finish every piece knowing what to charge.*
