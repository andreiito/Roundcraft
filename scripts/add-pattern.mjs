#!/usr/bin/env node
// Installs a pattern exported by Tapestry Studio into the site.
//
//   npm run publish-pattern -- --slug abducted-cow
//   npm run publish-pattern -- --slug abducted-cow --dry-run
//
// Options:
//   --from <dir>     the pattern's folder, or the folder containing it.
//                    Default: found next to this repo, see ROOT_CANDIDATES
//   --name <text>    display name for the catalog. Defaults to the name inside
//                    the .rcpattern with the "by NaredCraft" suffix removed
//   --tags a,b,c     catalog tags. Must exist in src/data/tags.json
//   --deploy         build, commit and push when everything is in place
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
import { spawnSync } from 'node:child_process';
import { readRcPattern, renderChartPng } from './lib/pattern.mjs';

const ASSETS = 'public/patterns/assets';
const INDEX = 'public/patterns/index.json';
const SOURCES = 'src/data/patterns';
const TAGS_FILE = 'src/data/tags.json';
const ORDER_FILE = 'src/data/order.json';

// Where Tapestry Studio keeps its patterns, most recent layout first. The
// folder has moved once already, so this looks rather than assumes; --from
// overrides. Each pattern lives in its own subfolder named after its slug.
const ROOT_CANDIDATES = [
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
const fromArg = arg('from');
const slug = arg('slug');
const previewOverride = arg('preview');
const displayName = arg('name');
const tagsArg = arg('tags');
const deploy = args.includes('--deploy');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const die = (...lines) => { for (const l of lines) console.error(l); process.exit(1); };

/** The generator writes some files prefixed with the slug and some bare, so
 *  every lookup accepts both spellings rather than demanding a rename. */
const firstExisting = (dir, names) => names.find((n) => existsSync(join(dir, n)));

if (!slug) die('usage: add-pattern.mjs --slug <slug> [--from <dir>] [--preview <path>] [--dry-run] [--force]');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug "${slug}" must be lowercase words joined by hyphens: it becomes the URL`);

// A pattern lives in <root>/<slug>/. --from can point either at that folder
// directly or at the root that contains it.
const roots = fromArg ? [fromArg] : ROOT_CANDIDATES;
const from = roots
  .flatMap((r) => [join(r, slug), r])
  .find((dir) => existsSync(dir) && firstExisting(dir, [`${slug}.rcpattern`, 'pattern.rcpattern']));

if (!from) {
  die(
    `Cannot find a folder with ${slug}.rcpattern in it. Looked in:`,
    ...roots.flatMap((r) => [`  ${join(r, slug)}`, `  ${r}`]),
    '',
    'Export it from Tapestry Studio into patterns/' + slug + '/, or pass --from <dir>.',
  );
}
const rcSource = join(from, firstExisting(from, [`${slug}.rcpattern`, 'pattern.rcpattern']));

const knownTags = JSON.parse(readFileSync(TAGS_FILE, 'utf8'));
const tags = tagsArg ? tagsArg.split(',').map((t) => t.trim()).filter(Boolean) : null;
const unknownTags = (tags ?? []).filter((t) => !(t in knownTags));
if (unknownTags.length) {
  die(
    `Unknown tag(s): ${unknownTags.join(', ')}`,
    '',
    `Available: ${Object.keys(knownTags).join(', ')}`,
    `Add a new one to ${TAGS_FILE} first, in both languages.`,
  );
}

let pattern;
try {
  pattern = readRcPattern(rcSource);
} catch (e) {
  die(`Could not read ${rcSource}: ${e.message}`, '', 'Run verify-pattern.mjs in Tapestry Studio to find out why.');
}
const { payload, colors, sha256 } = pattern;

// Copy jobs: source name in the generator's folder -> name this site serves it
// under. The generator already names exports after the pattern, so these mostly
// match; the bare spellings are a fallback for files renamed by hand before
// that was true. Only the pin-* images are published, never the social-* ones:
// those carry the landing URL printed on them, which is for posts, not for a
// page that already links everywhere.
const pick = (names) => {
  const found = firstExisting(from, names);
  return found ? join(from, found) : join(from, names[0]);
};
const jobs = [
  { src: rcSource, dst: `${slug}.rcpattern`, required: true },
  { src: pick([`${slug}-en.pdf`, 'en.pdf']), dst: `${slug}-en.pdf`, required: true },
  { src: pick([`${slug}-es.pdf`, 'es.pdf']), dst: `${slug}-es.pdf`, required: true },
  { src: pick([`${slug}-pin-chart.png`, 'pin-chart.png']), dst: `${slug}-pin-chart.png`, required: false },
  { src: pick([`${slug}-pin-overlay.png`, 'pin-overlay.png']), dst: `${slug}-pin-overlay.png`, required: false },
  { src: pick([`${slug}-pin-photo.png`, 'pin-photo.png']), dst: `${slug}-pin-photo.png`, required: false },
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
  // Strip the brand suffix the same way the pattern's data file does. Without
  // this the catalog read "Foo by NaredCraft" for every new pattern, while the
  // page read "Foo"; older entries hid it because `existing` already held a
  // corrected name.
  name: existing?.name ?? displayName ?? payload.name.replace(/\s+by\s+NaredCraft\s*$/i, ''),
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

// Same hand-picked order the pages use, so the catalog a person sees and the
// one a program reads cannot disagree. A slug not in the list keeps its append
// position at the end, which is where a just-published pattern belongs until
// someone says where it goes.
const order = JSON.parse(readFileSync(ORDER_FILE, 'utf8'));
const rank = (s) => {
  const i = order.indexOf(s);
  return i < 0 ? Infinity : i;
};
index.patterns.sort((a, b) => rank(a.slug) - rank(b.slug));
if (!order.includes(slug)) {
  console.log(`  note      ${slug} is not in ${ORDER_FILE}; it sits last in the catalog`);
}
if (!dryRun) writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
console.log(`  ${known ? 'update ' : 'add    '}  index.json (${index.patterns.length} pattern${index.patterns.length === 1 ? '' : 's'})`);

// The pattern's own data file. Written here so registration is not a paste job,
// but the prose is left to a person: a description nobody wrote is worse than no
// pattern at all, and the build refuses to publish a stub with empty copy.
const sourcePath = join(SOURCES, `${slug}.json`);
const hadSource = existsSync(sourcePath);
const source = hadSource
  ? JSON.parse(readFileSync(sourcePath, 'utf8'))
  : {
      slug,
      name: displayName ?? payload.name.replace(/\s+by\s+NaredCraft\s*$/i, ''),
      width: 0,
      height: 0,
      colors: 0,
      publishedAt: new Date().toISOString().slice(0, 10),
      tags: [],
      locales: {
        en: { seoDesc: '', about: '', bullets: [] },
        es: { seoDesc: '', about: '', bullets: [] },
      },
    };

// Dimensions always come from the file just installed, so a re-export cannot
// leave a stale stitch count on the page. Name and tags change only when asked.
source.width = payload.width;
source.height = payload.height;
source.colors = colors;
if (displayName) source.name = displayName;
if (tags) source.tags = tags;

if (!dryRun) writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n');
console.log(`  ${hadSource ? 'update ' : 'add    '}  ${sourcePath}`);

const needsCopy = ['en', 'es'].filter((l) => {
  const c = source.locales?.[l];
  return !c?.about?.trim() || !c?.seoDesc?.trim() || !c?.bullets?.length;
});
const needsTags = !source.tags?.length;

if (dryRun) console.log('\nDry run: nothing was written.');

if (needsCopy.length || needsTags) {
  console.log(`
Assets and registration are done. What is left needs a person:
`);
  if (needsTags) {
    console.log(`  Tags. Re-run with --tags a,b,c`);
    console.log(`  Available: ${Object.keys(knownTags).join(', ')}\n`);
  }
  if (needsCopy.length) {
    console.log(`  Copy for ${needsCopy.join(' and ')} in ${sourcePath}:`);
    console.log(`    seoDesc  one or two sentences, this is the search result`);
    console.log(`    about    what the piece is and how it is worked`);
    console.log(`    bullets  what is inside the PDF\n`);
  }
  console.log(`Everything else (title, subtitle, stitch count, licence, the app
pitch, every asset path) is derived, so there is nothing else to fill.`);
  console.log(`\nThen: npm run publish-pattern -- --slug ${slug} --deploy`);
} else if (deploy && !dryRun) {
  console.log('\nDeploying.\n');
  const run = (cmd, cmdArgs) => {
    const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
    if (r.status !== 0) { console.error(`\n${cmd} failed, stopping.`); process.exit(r.status ?? 1); }
  };
  run('npx', ['astro', 'build']);
  run('git', ['add', '-A']);
  // Nothing to commit is a success: the assets were already published.
  const staged = spawnSync('git', ['diff', '--cached', '--quiet']).status;
  if (staged === 0) {
    console.log('\nNothing changed, so nothing to deploy.');
  } else {
    run('git', ['commit', '-m', `Publish pattern: ${source.name}`]);
    run('git', ['push', 'origin', 'main']);
    console.log(`\nPushed. GitHub Actions is building; the page will be at`);
    console.log(`https://getroundcraft.com/patterns/${slug}.html in a minute or two.`);
  }
} else if (!dryRun) {
  console.log(`\nReady. To publish: npm run publish-pattern -- --slug ${slug} --deploy`);
}
