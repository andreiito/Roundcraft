#!/usr/bin/env node
// Chart images with no text and no branding, one set per published pattern.
//
//   npm run ravelry-images
//   npm run ravelry-images -- --slug spooky-mothman
//   npm run ravelry-images -- --cell 40
//
// Ravelry is not Pinterest. There a listing photo with a title, a logo and a
// FREE badge burned into it reads as an ad, and the first photo is the search
// thumbnail. So these are the chart and nothing else. Two versions of each,
// because they answer different questions:
//
//   -art.png    flat colour blocks. What the finished piece looks like, which
//               is what a thumbnail has to say in 200 px.
//   -chart.png  the same chart with a countable grid, heavy every tenth
//               stitch. Usable as a working chart.
//
// Both come from the published .rcpattern, so they cannot drift from the file
// people download: re-run this after re-publishing a pattern and the images
// follow. Output lands in ravelry/ (git-ignored, these are upload artefacts,
// not site assets) named the way the PDFs are, brand first, so they file
// together once they are sitting in a folder next to everything else.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readRcPattern, renderChartGridPng, renderChartPng } from './lib/pattern.mjs';

const ASSETS = 'public/patterns/assets';
const SOURCES = 'src/data/patterns';
const ORDER_FILE = 'src/data/order.json';
const OUT = 'ravelry';

// Long side of the image. Ravelry downscales for thumbnails and shows the full
// size on the pattern page; ~1400 is sharp there without being a 5 MB upload.
const TARGET_LONG_SIDE = 1400;

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = arg('slug');
const cellOverride = arg('cell') ? Number(arg('cell')) : undefined;

const order = JSON.parse(readFileSync(ORDER_FILE, 'utf8'));
const slugs = only ? [only] : order;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

let written = 0;
for (const slug of slugs) {
  const rc = join(ASSETS, `${slug}.rcpattern`);
  if (!existsSync(rc)) {
    console.log(`  skip     ${slug} (no .rcpattern published)`);
    continue;
  }
  const source = JSON.parse(readFileSync(join(SOURCES, `${slug}.json`), 'utf8'));
  const pattern = readRcPattern(rc);
  const { width, height } = pattern.payload;

  // An integer cell size keeps every stitch the same number of pixels. Scaling
  // to a round image size instead leaves some stitches a pixel wider than
  // their neighbours, which on a chart looks like a mistake in the chart.
  const cell = cellOverride ?? Math.max(12, Math.round(TARGET_LONG_SIDE / Math.max(width, height)));

  const base = `RoundCraft free pattern - ${source.name}`;
  const files = [
    [`${base} (art).png`, renderChartPng(pattern, cell)],
    [`${base} (chart).png`, renderChartGridPng(pattern, cell)],
  ];
  for (const [name, png] of files) {
    writeFileSync(join(OUT, name), png);
    written++;
  }
  console.log(
    `  ok       ${source.name.padEnd(20)} ${width}x${height} @ ${cell}px -> ${width * cell}x${height * cell}`,
  );
}

console.log(`\n${written} image${written === 1 ? '' : 's'} in ${OUT}/`);
