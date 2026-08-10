// Reading a .rcpattern, and drawing it.
//
// Reading the payload needs no key: only verifying the signature does, and
// that belongs to the generator's private repo. This side trusts the file and
// only needs its contents.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { encodePng, hexToRgb } from './png.mjs';

/** Run-length "N*#RRGGBB" or a bare colour, comma separated. */
export function decodeCells(encoded) {
  const out = [];
  for (const part of encoded.split(',')) {
    const star = part.indexOf('*');
    if (star > 0) {
      const count = Number(part.slice(0, star));
      const value = part.slice(star + 1);
      for (let i = 0; i < count; i++) out.push(value);
    } else {
      out.push(part);
    }
  }
  return out;
}

export function readRcPattern(path) {
  const text = readFileSync(path, 'utf8');
  const payload = JSON.parse(JSON.parse(Buffer.from(text, 'base64').toString('utf8')).p);
  const cells = decodeCells(payload.cells);
  if (cells.length !== payload.width * payload.height) {
    throw new Error(
      `cells decode to ${cells.length}, expected ${payload.width * payload.height} for ${payload.width} x ${payload.height}`,
    );
  }
  return {
    payload,
    cells,
    colors: new Set(cells.filter(Boolean)).size,
    // The hash the app stores for duplicate detection, over the trimmed text.
    sha256: createHash('sha256').update(text.trim(), 'utf8').digest('hex'),
  };
}

const EMPTY = [255, 255, 255];

/**
 * Renders the chart the way the catalog already shows it: flat colour blocks,
 * one square per stitch, no interior grid. 20 px a cell reproduces the sizes
 * of the previews published so far (39 x 66 -> 780 x 1320).
 *
 * No grid because the published preview has none: at thumbnail size the rules
 * turn into moiré and the blocks already read as a chart. The mat colour is
 * only used where a cell has no stitch.
 */
export function renderChartPng({ payload, cells }, cell = 20) {
  const { width, height } = payload;
  const w = width * cell;
  const h = height * cell;
  const rgb = new Uint8Array(w * h * 3);

  for (let y = 0; y < height; y++) {
    // Row 0 of the payload is the first row worked, which is the bottom of the
    // finished piece. Charts are read the way the piece hangs, so the render
    // walks the rows in reverse.
    const source = (height - 1 - y) * width;
    for (let x = 0; x < width; x++) {
      const value = cells[source + x];
      const [r, g, b] = value ? hexToRgb(value) : EMPTY;
      for (let dy = 0; dy < cell; dy++) {
        let i = ((y * cell + dy) * w + x * cell) * 3;
        for (let dx = 0; dx < cell; dx++) {
          rgb[i++] = r; rgb[i++] = g; rgb[i++] = b;
        }
      }
    }
  }

  return encodePng(w, h, rgb);
}
