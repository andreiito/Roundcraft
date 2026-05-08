# RoundCraft Privacy Policy

_Last updated: 2026-05-08_

RoundCraft (the "App") is published by **Andre Ortiz Loyola Castañeda**, an independent developer operating under the **NaredRitzo** developer brand. The App also surfaces links to the developer's separate craft brand, **NaredCraft** (Etsy shop, support page). This policy explains what data the App handles and how it is used.

---

## TL;DR

- The App is **offline-first**. Your projects, counters, time, photos, materials, quotes and brand assets live **only on your device**.
- We do **not** require an account, login, email or any personal identifier to use the App.
- We do **not** transmit your project content to any server.
- The App contains **no third-party advertising, no analytics, and no tracking SDKs**. The only in-app promotions you'll see are links to the developer's own NaredCraft Etsy shop and tip jar — never paid ads from external networks.
- A future paid Premium plan will be processed by Google Play; we never see your payment details.
- Optional crash reports (via Sentry) are **disabled by default**. When enabled, they contain only technical error details — never your project content.

---

## Data we store on your device

The App stores the following information **locally** on your phone using SQLite (`expo-sqlite`):

### Project content
- **Projects**: name, optional cover photo (image URI on your device), optional cover position/scale (for framing), notes, status, creation date.
- **Counters**: name, color, value, optional goal, position.
- **Timer sessions**: start/end timestamps and accumulated duration per project.
- **Materials**: name, unit, quantity, unit cost.
- **Saved materials library**: shared material presets with usage count.
- **Quote settings**: hourly rate, profit margin, mode (simple/detailed), template.
- **Tags**: name, color, project associations.
- **Tapestry patterns**: cells, palette, optional reference image URI, position/scale/opacity of the reference, cursor position.

### App settings & branding
- **App settings**: language, theme, accent color, default hourly rate, currency, reminder preferences, custom hex colors you saved, onboarding status, rating prompt status.
- **User branding (Premium feature)**: optional logo image URI and brand name you upload, used only when you export a project summary.
- **Subscription state**: plan kind (free / monthly / 6-month / annual / lifetime / trial), expiration date if applicable, the redemption code you entered (if any). This is stored locally for offline gating; we do **not** send this to any server.

This data **never leaves your device** unless you explicitly export it (e.g. tapping "Share" on a project summary, which produces an image you can then share via any installed app).

---

## Permissions the App requests

| Permission | Why we need it |
|---|---|
| **Camera** | Only when you tap "Take photo" to add a cover photo to a project, a reference image to a tapestry pattern, or your brand logo. The image is saved locally; we do not upload it. |
| **Photos / Media library** | Only when you tap "Pick from gallery" to choose an image from your phone for the same purposes as above. |
| **Notifications** | Only if you enable "Remind me if I haven't woven in X days" in Settings. We schedule local notifications that fire on your device — they are not sent from any server. |

You can revoke any of these permissions at any time from your phone's Settings. The App will continue to work for any feature that doesn't require the revoked permission.

---

## What we DO NOT collect

- ❌ No email, name, age, gender, address or any personal identifier
- ❌ No advertising ID, IDFA, or device identifiers for advertising
- ❌ No third-party advertising networks (AdMob, Meta Audience Network, etc.) — the App is **free of paid third-party ads**. The only in-app promotions are first-party links to the developer's own NaredCraft Etsy shop and Buy Me a Coffee tip jar.
- ❌ No analytics on your behaviour, taps, screens or session length
- ❌ No location data (foreground or background)
- ❌ No contacts, microphone, calendar, SMS or call history
- ❌ No biometric or health data
- ❌ No social network integration

---

## In-app rating prompt (`expo-store-review`)

After you mark your first project as finished, the App may ask if you'd like to leave a rating on Google Play. If you accept, Google Play opens its native review sheet — RoundCraft never sees, stores or transmits the rating you submit. The exchange is entirely between you and Google. If you decline, the prompt does not appear again.

---

## Premium subscriptions (not active yet)

The current public release of the App does **not** process any payments. When in-app purchases are activated in a future version, they will be handled by **Google Play Billing** (potentially through RevenueCat for receipt validation). In that case:

- Your payment method, billing address, and transaction history are managed by **Google** under [Google's privacy policy](https://policies.google.com/privacy).
- We receive only an anonymized purchase token and the entitlement state ("active subscription: monthly / 6-month / annual"). No personal billing information is shared with us.
- If RevenueCat is integrated, see [RevenueCat's privacy policy](https://www.revenuecat.com/privacy/) for how they process anonymized purchase events.
- Premium activation codes (e.g. for testers and beta users) are validated **locally on your device**. No code redemption data leaves your phone.

This section will be updated when payments go live.

---

## Crash reports (optional, currently off)

The App ships with the Sentry SDK installed but **disabled** (no DSN configured). When/if crash reporting is activated in a future update, technical error data may be sent to Sentry's infrastructure (operated by Functional Software, Inc.):

- Error message and stack trace
- Device model and OS version
- App version
- A randomly generated session identifier (not tied to you personally)

Crash reports do **not** include any of your project content (no project names, photos, counts, materials, brand assets, etc.). Sentry's privacy policy: https://sentry.io/privacy/

If you do not want crash reporting once it's enabled, you can stop using the App or disable network access for the App in Android system settings.

---

## Sharing features

When you tap "Share project summary" or "Share quote", the App generates an image **on your device** with the data you've entered (project name, totals, optional cover photo, optional brand logo). You can then share that image through any app installed on your phone (WhatsApp, Instagram, Drive, Email, etc.). The destination of that share is governed by **the app you choose**, not by RoundCraft.

---

## Links to third-party services

The App contains links to:

- **NaredCraft Etsy shop** (https://naredcraft.etsy.com): governed by [Etsy's privacy policy](https://www.etsy.com/legal/privacy/).
- **Buy Me a Coffee tip jar** (https://buymeacoffee.com/naredcraft): governed by [Buy Me a Coffee's privacy policy](https://buymeacoffee.com/privacy-policy).
- **Google Play store review page**: governed by Google.

We do not control these services. Visiting them is entirely optional.

---

## Children

The App is not designed for or targeted at children under 13. We do not knowingly collect any data from children. If you believe a child has used the App and you have concerns, contact us at the address below.

In Google Play's content rating, the App is classified as suitable for all ages but is not enrolled in the Designed for Families program.

---

## Your rights

Because the App stores all data locally on your device and we do not collect personal data on any server:

- **Access**: open the App — everything we hold about you is visible inside it.
- **Deletion**: delete a project (or uninstall the App) and the data is permanently removed from your device.
- **Portability**: use the "Share" feature to export a project as an image to anywhere you like.
- **Withdrawal of consent**: revoke camera, photos or notifications permissions at any time from Android Settings.

We have no servers from which to delete personal data on your behalf, because we hold none.

### GDPR (European Economic Area, UK) and CCPA (California)

These regulations apply to controllers that collect personal data. Since we do not collect personal data and store nothing on remote servers, the obligations to provide data subject access, erasure or opt-out do not apply to RoundCraft. If you live in the EU/UK/California and have questions, contact us using the details below.

---

## Changes to this policy

If this policy changes, we will update the "Last updated" date at the top of this document. Continued use of the App after a change constitutes acceptance of the new policy. For material changes (new data collection, new third-party services), we will note the change clearly in the App's release notes on Google Play.

---

## Contact

If you have any questions or requests about this policy, contact us:

- **Developer**: Andre Ortiz Loyola Castañeda
- **Developer brand**: NaredRitzo
- **Craft brand referenced in the App**: NaredCraft
- **Email**: oica950624@gmail.com
- **Etsy shop (NaredCraft)**: https://naredcraft.etsy.com

---

_RoundCraft is built and maintained by Andre Ortiz Loyola Castañeda — published under the **NaredRitzo** developer brand. An independent developer who also crochets. Built with care, for craft._
