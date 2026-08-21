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

const RULE = [140, 140, 140];
const RULE_10 = [34, 34, 34];

/**
 * The same chart with a countable grid, and nothing else: no title, no logo, no
 * badge. For listing photos on channels where marketing text on the image reads
 * as spam, and for anyone who wants to work straight off the picture.
 *
 * Lines are drawn ON the cell's own edge pixels rather than between cells, so
 * the geometry stays width * cell and every square is the same size. Heavy
 * lines land every tenth stitch counted from the left and from the BOTTOM,
 * because row 1 is the bottom row: counting them from the top would disagree
 * with the written pattern.
 *
 * Grids need room. Below about 12 px a cell the rules eat the colour and the
 * whole thing greys out, which is why the catalog preview has none.
 */
export function renderChartGridPng({ payload, cells }, cell = 30) {
  const { width, height } = payload;
  const heavy = Math.max(2, Math.round(cell / 12));
  const w = width * cell;
  const h = height * cell;
  const rgb = new Uint8Array(w * h * 3);

  const dot = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 3;
    rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b;
  };

  for (let y = 0; y < height; y++) {
    const source = (height - 1 - y) * width;
    const fromBottom = height - y;
    for (let x = 0; x < width; x++) {
      const value = cells[source + x];
      const [r, g, b] = value ? hexToRgb(value) : EMPTY;
      const x0 = x * cell;
      const y0 = y * cell;
      for (let dy = 0; dy < cell; dy++) {
        let i = ((y0 + dy) * w + x0) * 3;
        for (let dx = 0; dx < cell; dx++) {
          rgb[i++] = r; rgb[i++] = g; rgb[i++] = b;
        }
      }

      // Right and bottom edge of every cell, so interior lines are shared and
      // the outer border is drawn once by the last row and column.
      for (let k = 0; k < cell; k++) {
        dot(x0 + cell - 1, y0 + k, RULE);
        dot(x0 + k, y0 + cell - 1, RULE);
      }

      // A cell's LOWER edge in the image is the boundary under that row, so the
      // rule after ten rows is the lower edge of row 11, not the upper edge.
      // Drawing it on the upper edge put every heavy line one row too high, and
      // it still looked plausible: 10, 20, 30 bands, just anchored wrong.
      const tens = [];
      if ((x + 1) % 10 === 0 || x + 1 === width) tens.push('right');
      if (x === 0) tens.push('left');
      if ((fromBottom - 1) % 10 === 0) tens.push('under');
      if (fromBottom === height) tens.push('over');
      for (const side of tens) {
        for (let t = 0; t < heavy; t++) {
          for (let k = 0; k < cell; k++) {
            if (side === 'right') dot(x0 + cell - 1 - t, y0 + k, RULE_10);
            if (side === 'left') dot(x0 + t, y0 + k, RULE_10);
            if (side === 'under') dot(x0 + k, y0 + cell - 1 - t, RULE_10);
            if (side === 'over') dot(x0 + k, y0 + t, RULE_10);
          }
        }
      }
    }
  }

  return encodePng(w, h, rgb);
}
