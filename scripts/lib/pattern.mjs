// Reading a .rcpattern, and drawing it.
//
// Reading the payload needs no key: only verifying the signature does, and
// that belongs to the generator's private repo. This side trusts the file and
// only needs its contents.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { GLYPH_H, GLYPH_W, GLYPHS, symbolAt } from './glyphs.mjs';
import { encodePng, hexToRgb } from './png.mjs';

// Same threshold the generator uses to pick ink over a yarn, so a cell that
// reads black-on-colour in the PDF reads black-on-colour here.
const isLight = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;

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
 * lines land every `major` stitches counted from the left and from the BOTTOM,
 * because row 1 is the bottom row: counting them from the top would disagree
 * with the written pattern.
 *
 * Grids need room. Below about 12 px a cell the rules eat the colour and the
 * whole thing greys out, which is why the catalog preview has none.
 *
 * With `symbols`, each stitch also gets the character its colour carries in the
 * PDF legend, black on light yarns and white on dark ones. That is what makes a
 * chart workable by someone printing in black and white or picking colours
 * apart that read the same in a photo.
 */
export function renderChartGridPng({ payload, cells }, cell = 30, { major = 10, symbols = false } = {}) {
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

  // First-appearance order through the cells, which is the order the generator
  // hands out symbols in. Row 0 of the payload is the bottom row, so the scan
  // starts where the work starts.
  const symbolOf = new Map();
  if (symbols) {
    for (const value of cells) {
      if (value && !symbolOf.has(value)) symbolOf.set(value, symbolAt(symbolOf.size));
    }
  }
  const scale = Math.max(1, Math.round((cell * 0.62) / GLYPH_H));
  const glyphW = GLYPH_W * scale;
  const glyphH = GLYPH_H * scale;

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

      if (symbols && value) {
        const glyph = GLYPHS[symbolOf.get(value)];
        const ink = isLight([r, g, b]) ? [0, 0, 0] : [255, 255, 255];
        const gx = x0 + Math.round((cell - glyphW) / 2);
        const gy = y0 + Math.round((cell - glyphH) / 2);
        for (let ry = 0; ry < GLYPH_H; ry++) {
          for (let rx = 0; rx < GLYPH_W; rx++) {
            if (glyph[ry][rx] !== '#') continue;
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) dot(gx + rx * scale + sx, gy + ry * scale + sy, ink);
            }
          }
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
      if ((x + 1) % major === 0 || x + 1 === width) tens.push('right');
      if (x === 0) tens.push('left');
      if ((fromBottom - 1) % major === 0) tens.push('under');
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
