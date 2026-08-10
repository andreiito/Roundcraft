#!/usr/bin/env node
// Installs a pattern exported by Tapestry Studio into the site.
//
//   npm run publish-pattern -- --slug abducted-cow
//   npm run publish-pattern -- --slug abducted-cow --dry-run
//
// Options:
//   --from <dir>     where the generator's export sits.
//                    Default: found next to this repo, see FROM_CANDIDATES
//   --preview <path> use this image as the catalog preview instead of
//                    rendering the chart
//   --force          overwrite published files that differ from the incoming
//                    ones. Read the warning before you reach for it.
//   --dry-run        say what would happen, write nothing
//
// The signature check is deliberately not here. It needs the signing key and
// this repo is public, so it lives in the generator's private repo:
//   node scripts/verify-pattern.mjs patterns/<slug>.rcpattern
// Run that first. This script refuses to install a file it cannot even read,
// but it cannot tell you whether the app will trust the signature.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readRcPattern, renderChartPng } from './lib/pattern.mjs';

const ASSETS = 'public/patterns/assets';
const INDEX = 'public/patterns/index.json';

// Where Tapestry Studio's export tends to be, most recent layout first. It has
// moved once already, so this looks rather than assumes; --from overrides.
const FROM_CANDIDATES = [
  '../Count Row App/tapestry-studio/patterns',
  '../tapestry-studio/patterns',
  '../NaredCraft - WebTapestry/patterns',
];

// The app's import allow-list is checked against these strings, and the
// version on the Play Store today only accepts the github.io host. Keep the
// catalog on that host until a release with getroundcraft.com has been out
// long enough. See the note on deepLinkTarget in src/data/patterns.ts.
const HOST = 'https://andreiito.github.io/Roundcraft';

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const from = arg('from') ?? FROM_CANDIDATES.find((c) => existsSync(c));
const slug = arg('slug');
const previewOverride = arg('preview');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const die = (...lines) => { for (const l of lines) console.error(l); process.exit(1); };

if (!slug) die('usage: add-pattern.mjs --slug <slug> [--from <dir>] [--preview <path>] [--dry-run] [--force]');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug "${slug}" must be lowercase words joined by hyphens: it becomes the URL`);

if (!from) {
  die(
    'Cannot find the Tapestry Studio export folder. Looked in:',
    ...FROM_CANDIDATES.map((c) => `  ${c}`),
    '',
    'Pass --from <dir> if it lives somewhere else.',
  );
}
const rcSource = join(from, `${slug}.rcpattern`);
if (!existsSync(rcSource)) {
  die(`No ${slug}.rcpattern in ${from}`, '', 'Export it from Tapestry Studio first, or pass --from <dir>.');
}

let pattern;
try {
  pattern = readRcPattern(rcSource);
} catch (e) {
  die(`Could not read ${rcSource}: ${e.message}`, '', 'Run verify-pattern.mjs in Tapestry Studio to find out why.');
}
const { payload, colors, sha256 } = pattern;

// Copy jobs: source name in the generator's folder -> name this site serves
// it under. The pin images need renaming; the generator writes the same three
// filenames for every pattern, so its folder only ever holds the most recent
// one and a second export would overwrite the first.
const jobs = [
  { src: rcSource, dst: `${slug}.rcpattern`, required: true },
  { src: join(from, `${slug}-en.pdf`), dst: `${slug}-en.pdf`, required: true },
  { src: join(from, `${slug}-es.pdf`), dst: `${slug}-es.pdf`, required: true },
  { src: join(from, 'pin-chart.png'), dst: `${slug}-pin-chart.png`, required: false },
  { src: join(from, 'pin-overlay.png'), dst: `${slug}-pin-overlay.png`, required: false },
  { src: join(from, 'pin-photo.png'), dst: `${slug}-pin-photo.png`, required: false },
];

const missing = jobs.filter((j) => j.required && !existsSync(j.src));
if (missing.length) die(`Missing in ${from}:`, ...missing.map((j) => `  ${j.src}`));

const digest = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// Refuse to quietly replace a published file with a different one. The PDFs
// are the reason: the copies in the generator's folder are the plain export,
// while the published ones carry the QR and the licence, so a copy in the
// wrong direction strips both from the live download and says nothing.
const clashes = jobs.filter((j) => {
  const dst = join(ASSETS, j.dst);
  return existsSync(j.src) && existsSync(dst) && digest(j.src) !== digest(dst);
});
if (clashes.length && !force) {
  die(
    'These files already exist here and differ from the ones you are copying in:',
    '',
    ...clashes.map((j) => `  ${j.dst}`),
    '',
    'If the published version is the newer one, this would undo it. Check first,',
    'then pass --force to go ahead.',
  );
}

console.log(`${payload.name}\n${payload.width} x ${payload.height}, ${colors} colours, ${payload.width * payload.height} stitches\n`);

for (const j of jobs) {
  if (!existsSync(j.src)) { console.log(`  skip     ${j.dst} (not exported)`); continue; }
  const dst = join(ASSETS, j.dst);
  const verb = !existsSync(dst) ? 'add' : digest(j.src) === digest(dst) ? 'same' : 'replace';
  if (!dryRun && verb !== 'same') copyFileSync(j.src, dst);
  console.log(`  ${verb.padEnd(7)}  ${j.dst}`);
}

// The catalog preview is a plain chart render, so there is no reason to make
// one by hand: the chart is in the file we just installed.
const previewDst = join(ASSETS, `${slug}-preview.png`);
if (previewOverride) {
  if (!dryRun) copyFileSync(resolve(previewOverride), previewDst);
  console.log(`  ${existsSync(previewDst) ? 'replace' : 'add'}  ${slug}-preview.png (from --preview)`);
} else {
  const png = renderChartPng(pattern);
  const same = existsSync(previewDst) && digest(previewDst) === createHash('sha256').update(png).digest('hex');
  if (!dryRun && !same) writeFileSync(previewDst, png);
  console.log(`  ${same ? 'same   ' : existsSync(previewDst) ? 'replace' : 'add    '}  ${slug}-preview.png (rendered)`);
}

const index = JSON.parse(readFileSync(INDEX, 'utf8'));
const existing = index.patterns.find((p) => p.slug === slug);

// The name inside the file is the one the app gives the imported project, and
// it carries the brand: "Abducted Cow by NaredCraft". The catalog shows a
// shorter display name. Once someone has chosen that name, a re-export must
// not quietly overwrite it.
const meta = {
  slug,
  name: existing?.name ?? payload.name,
  width: payload.width,
  height: payload.height,
  colors,
  preview: `${HOST}/patterns/assets/${slug}-preview.png`,
  rcpattern: `${HOST}/patterns/assets/${slug}.rcpattern`,
  sha256,
  page: `${HOST}/patterns/${slug}.html`,
};
const at = index.patterns.findIndex((p) => p.slug === slug);
const known = at >= 0;
if (known) index.patterns[at] = meta;
else index.patterns.push(meta);
if (!dryRun) writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
console.log(`  ${known ? 'update ' : 'add    '}  index.json (${index.patterns.length} pattern${index.patterns.length === 1 ? '' : 's'})`);

if (dryRun) console.log('\nDry run: nothing was written.');

if (!known) {
  console.log(`
The assets are in place. What is left is the writing, which no script should
guess: add this to src/data/patterns.ts and fill in the copy.

  {
    slug: '${slug}',
    name: ${JSON.stringify(payload.name)},
    width: ${payload.width},
    height: ${payload.height},
    colors: ${colors},
    preview: '/patterns/assets/${slug}-preview.png',
    ogImage: '/patterns/assets/${slug}-pin-photo.png',
    pdf: { en: '/patterns/assets/${slug}-en.pdf', es: '/patterns/assets/${slug}-es.pdf' },
    rcpattern: '/patterns/assets/${slug}.rcpattern',
    deepLinkTarget: '${meta.rcpattern}',
    tags: [],
    meta: {
      en: '${payload.width} × ${payload.height} · ${colors} colors · tapestry crochet',
      es: '${payload.width} × ${payload.height} · ${colors} colores · tapestry crochet',
    },
    locales: { en: { /* … */ }, es: { /* … */ } },
  },

Tags come from TAGS in that same file. Add a new one there before using it.
Then: npm run deploy`);
} else {
  console.log('\nAlready in the catalog, so nothing to write by hand. Next: npm run deploy');
}
