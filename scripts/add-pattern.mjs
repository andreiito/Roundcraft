#!/usr/bin/env node
// Installs a pattern exported by Tapestry Studio into the site.
//
// The generator writes into a single scratch folder and names some files
// generically (pin-chart.png, not abducted-cow-pin-chart.png), so publishing
// used to mean copying and renaming by hand. That is fine once and a source of
// silent mistakes forever after: a preview that still points at the previous
// pattern, a sha256 in the catalog that no longer matches the file, a pin
// image overwritten by the next export.
//
//   node scripts/add-pattern.mjs --from "../NaredCraft - WebTapestry/patterns" --slug abducted-cow
//   node scripts/add-pattern.mjs --from <dir> --slug <slug> --dry-run
//
// Verify the file itself first, in the Tapestry Studio repo:
//   node scripts/verify-pattern.mjs patterns/<slug>.rcpattern
// That checks the signature, which needs the signing key and so cannot live
// in this repo: it is public.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ASSETS = 'public/patterns/assets';
const INDEX = 'public/patterns/index.json';

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
const from = arg('from');
const slug = arg('slug');
const previewOverride = arg('preview');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (!from || !slug) {
  console.error('usage: add-pattern.mjs --from <tapestry-studio/patterns> --slug <slug> [--preview <path>] [--dry-run] [--force]');
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug "${slug}" must be lowercase words joined by hyphens: it becomes the URL`);
  process.exit(1);
}

// Source name in the generator's folder -> name this site serves it under.
// The pin images are the ones that need renaming; the generator does not know
// which pattern it is writing.
const FILES = [
  { src: `${slug}.rcpattern`, dst: `${slug}.rcpattern`, required: true },
  { src: `${slug}-en.pdf`, dst: `${slug}-en.pdf`, required: true },
  { src: `${slug}-es.pdf`, dst: `${slug}-es.pdf`, required: true },
  { src: previewOverride ?? `${slug}-preview.png`, dst: `${slug}-preview.png`, required: true, absolute: Boolean(previewOverride) },
  { src: 'pin-chart.png', dst: `${slug}-pin-chart.png`, required: false },
  { src: 'pin-overlay.png', dst: `${slug}-pin-overlay.png`, required: false },
  { src: 'pin-photo.png', dst: `${slug}-pin-photo.png`, required: false },
];

const srcPath = (f) => (f.absolute ? resolve(f.src) : join(from, f.src));
const missing = FILES.filter((f) => f.required && !existsSync(srcPath(f)));
if (missing.length) {
  console.error(`Missing in ${from}:`);
  for (const f of missing) console.error(`  ${f.src}`);
  if (missing.some((f) => f.src.endsWith('-preview.png'))) {
    console.error(`\nTapestry Studio does not export the catalog preview. Either save it as`);
    console.error(`${slug}-preview.png next to the other files, or pass --preview <path>.`);
  }
  process.exit(1);
}

// Read the metadata out of the signed payload. Reading needs no key; only
// verifying the signature does, which is the generator's job.
const rcText = readFileSync(join(from, `${slug}.rcpattern`), 'utf8');
let payload;
try {
  payload = JSON.parse(JSON.parse(Buffer.from(rcText, 'base64').toString('utf8')).p);
} catch {
  console.error('Could not read the .rcpattern. Run verify-pattern.mjs in Tapestry Studio to find out why.');
  process.exit(1);
}
const cells = payload.cells.split(',').flatMap((part) => {
  const star = part.indexOf('*');
  return star > 0 ? Array(Number(part.slice(0, star))).fill(part.slice(star + 1)) : [part];
});
const meta = {
  slug,
  name: payload.name,
  width: payload.width,
  height: payload.height,
  colors: new Set(cells.filter(Boolean)).size,
  preview: `${HOST}/patterns/assets/${slug}-preview.png`,
  rcpattern: `${HOST}/patterns/assets/${slug}.rcpattern`,
  sha256: createHash('sha256').update(rcText.trim(), 'utf8').digest('hex'),
  page: `${HOST}/patterns/${slug}.html`,
};

console.log(`${meta.name}  ${meta.width} x ${meta.height}, ${meta.colors} colours\n`);

const digest = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// Refuse to quietly replace a published file with a different one. The PDFs
// are the reason: the generator's scratch copies are the plain export, while
// the published ones carry the QR and the licence, so a copy in the wrong
// direction silently strips both from the live download.
const clashes = [];
for (const f of FILES) {
  const src = srcPath(f);
  const dst = join(ASSETS, f.dst);
  if (existsSync(src) && existsSync(dst) && digest(src) !== digest(dst)) clashes.push(f.dst);
}
if (clashes.length && !force) {
  console.error('These files already exist here and differ from the ones you are copying in:\n');
  for (const name of clashes) console.error(`  ${name}`);
  console.error('\nIf the published version is the newer one, this would undo it. Check first,');
  console.error('then pass --force to go ahead.');
  process.exit(1);
}

for (const f of FILES) {
  const src = srcPath(f);
  if (!existsSync(src)) { console.log(`  skip     ${f.src} (not exported)`); continue; }
  const dst = join(ASSETS, f.dst);
  const verb = !existsSync(dst) ? 'add' : digest(src) === digest(dst) ? 'same' : 'replace';
  if (!dryRun && verb !== 'same') copyFileSync(src, dst);
  console.log(`  ${verb.padEnd(7)}  ${f.dst}`);
}

const index = JSON.parse(readFileSync(INDEX, 'utf8'));
const at = index.patterns.findIndex((p) => p.slug === slug);
if (at >= 0) index.patterns[at] = meta;
else index.patterns.push(meta);
if (!dryRun) writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
console.log(`  ${at >= 0 ? 'update' : 'add'}   ${INDEX} (${index.patterns.length} total)`);

if (dryRun) console.log('\nDry run: nothing was written.');

if (at < 0) {
  console.log(`\nStill to do by hand, because it is writing, not plumbing:`);
  console.log(`  Add the entry to src/data/patterns.ts. Skeleton:\n`);
  console.log(`  {
    slug: '${slug}',
    name: ${JSON.stringify(meta.name)},
    width: ${meta.width},
    height: ${meta.height},
    colors: ${meta.colors},
    preview: '/patterns/assets/${slug}-preview.png',
    ogImage: '/patterns/assets/${slug}-pin-photo.png',
    pdf: { en: '/patterns/assets/${slug}-en.pdf', es: '/patterns/assets/${slug}-es.pdf' },
    rcpattern: '/patterns/assets/${slug}.rcpattern',
    deepLinkTarget: '${meta.rcpattern}',
    tags: [],
    meta: {
      en: '${meta.width} × ${meta.height} · ${meta.colors} colors · tapestry crochet',
      es: '${meta.width} × ${meta.height} · ${meta.colors} colores · tapestry crochet',
    },
    locales: { en: { /* … */ }, es: { /* … */ } },
  },`);
  console.log(`\n  Tags come from TAGS in that file. Add a new one there before using it.`);
}
