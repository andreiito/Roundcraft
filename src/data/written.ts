import { readFileSync } from 'node:fs';

import type { Lang } from '../i18n/utils';

/** The order the generator hands out legend symbols in (SYMBOLS in its
 *  exportPdf.ts, GLYPH_ORDER in scripts/lib/glyphs.mjs). A colour's symbol is
 *  its position in first-appearance order through the chart, so the page, the
 *  PDF and the gridded chart image all agree on what a cell means. */
const SYMBOLS = ['X', 'O', '+', '*', '/', '\\', '=', '#', '%', '@', '&', '<', '>', '?', 'S', 'Z', 'T', 'V', 'L', 'C', 'U', 'N', 'H', 'K'];

export interface Yarn {
  hex: string;
  symbol: string;
  name: Record<Lang, string>;
  stitches: number;
  light: boolean;
}

export interface WrittenRow {
  /** 1-based, as a crocheter counts. */
  n: number;
  side: 'RS' | 'WS';
  /** Runs in working order: right to left on RS rows, left to right on WS. */
  runs: { yarn: number; count: number }[];
}

export interface Written {
  width: number;
  height: number;
  yarns: Yarn[];
  rows: WrittenRow[];
}

/** A reader sees "dark grey", not "#535353". Nearest of a short list of names a
 *  yarn label would use, so it is a description of the colour and not a promise
 *  of a specific yarn. */
const NAMED: [string, string, string][] = [
  ['#FFFFFF', 'White', 'Blanco'],
  ['#F5F0E6', 'Off-white', 'Blanco hueso'],
  ['#E8D9B5', 'Cream', 'Crema'],
  ['#C8C8C8', 'Light grey', 'Gris claro'],
  ['#8C8C8C', 'Grey', 'Gris'],
  ['#4F4F4F', 'Dark grey', 'Gris oscuro'],
  ['#1A1A1A', 'Black', 'Negro'],
  ['#C62828', 'Red', 'Rojo'],
  ['#7A1E2B', 'Burgundy', 'Vino'],
  ['#F48FB1', 'Pink', 'Rosa'],
  ['#C2185B', 'Magenta', 'Magenta'],
  ['#EF6C00', 'Orange', 'Naranja'],
  ['#D14B26', 'Terracotta', 'Terracota'],
  ['#F2C14E', 'Mustard', 'Mostaza'],
  ['#FDD835', 'Yellow', 'Amarillo'],
  ['#D4A574', 'Tan', 'Beige'],
  ['#8D5A2B', 'Brown', 'Café'],
  ['#4E342E', 'Dark brown', 'Café oscuro'],
  ['#9CCC65', 'Light green', 'Verde claro'],
  ['#2E7D32', 'Green', 'Verde'],
  ['#1B4D2E', 'Forest green', 'Verde bosque'],
  ['#808000', 'Olive', 'Verde oliva'],
  ['#26A69A', 'Teal', 'Verde azulado'],
  ['#81D4FA', 'Light blue', 'Azul claro'],
  ['#1E88E5', 'Blue', 'Azul'],
  ['#1A237E', 'Navy', 'Azul marino'],
  ['#B39DDB', 'Lilac', 'Lila'],
  ['#6A1B9A', 'Purple', 'Morado'],
];

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function nameOf(hex: string): Record<Lang, string> {
  const [r, g, b] = rgb(hex);
  let best = NAMED[0];
  let bestD = Infinity;
  for (const entry of NAMED) {
    const [r2, g2, b2] = rgb(entry[0]);
    // Redmean: cheap, and much closer to how far apart two colours look than a
    // plain RGB distance, which calls most dark colours "black".
    const rm = (r + r2) / 2;
    const d = (2 + rm / 256) * (r - r2) ** 2 + 4 * (g - g2) ** 2 + (2 + (255 - rm) / 256) * (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = entry; }
  }
  return { en: best[1], es: best[2] };
}

const SHADES: Record<Lang, string[][]> = {
  en: [[], [], ['light shade', 'dark shade'], ['light shade', 'medium shade', 'dark shade']],
  es: [[], [], ['tono claro', 'tono oscuro'], ['tono claro', 'tono medio', 'tono oscuro']],
};

/** Two yarns of one pattern can land on the same name (a chart with two
 *  off-whites). A shopping list that says "Off-white" twice is no list, so the
 *  repeats get told apart by lightness. Beyond three of one name the symbol and
 *  hex column already carry it. */
function distinguishShades(yarns: Yarn[]) {
  const groups = new Map<string, Yarn[]>();
  for (const y of yarns) groups.set(y.name.en, [...(groups.get(y.name.en) ?? []), y]);
  for (const group of groups.values()) {
    if (group.length < 2 || group.length > 3) continue;
    const luma = (y: Yarn) => { const [r, g, b] = rgb(y.hex); return 0.299 * r + 0.587 * g + 0.114 * b; };
    [...group].sort((a, b) => luma(b) - luma(a)).forEach((y, i) => {
      y.name = {
        en: `${y.name.en} (${SHADES.en[group.length][i]})`,
        es: `${y.name.es} (${SHADES.es[group.length][i]})`,
      };
    });
  }
}

/** Same threshold as the generator, so ink on a chip matches ink in the PDF. */
const isLight = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
};

/** Run-length "N*#RRGGBB" or a bare colour, comma separated. Mirrors
 *  decodeCells in scripts/lib/pattern.mjs. */
function decodeCells(encoded: string): string[] {
  const out: string[] = [];
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

/** Build-time only: reads the published .rcpattern, so the page can never
 *  describe a different chart from the file people download. */
export function writtenPattern(slug: string): Written {
  const path = new URL(`../../public/patterns/assets/${slug}.rcpattern`, import.meta.url);
  const text = readFileSync(path, 'utf8');
  const payload = JSON.parse(JSON.parse(Buffer.from(text, 'base64').toString('utf8')).p);
  const { width, height } = payload as { width: number; height: number };
  const cells = decodeCells(payload.cells);
  if (cells.length !== width * height) {
    throw new Error(`${slug}.rcpattern decodes to ${cells.length} cells, expected ${width * height}`);
  }
  if (cells.some((c) => !c)) {
    // An empty cell is "no stitch", which flat single crochet cannot do. No
    // published pattern has one; if one ever does, it needs its own wording.
    throw new Error(`${slug}.rcpattern has empty cells; the written pattern has no wording for them yet`);
  }

  // Row 0 is the first row worked, the bottom of the piece. First-appearance
  // order through the cells from there is the symbol order.
  const index = new Map<string, number>();
  const yarns: Yarn[] = [];
  for (const hex of cells) {
    if (index.has(hex)) { yarns[index.get(hex)!].stitches++; continue; }
    index.set(hex, yarns.length);
    yarns.push({ hex, symbol: SYMBOLS[yarns.length % SYMBOLS.length], name: nameOf(hex), stitches: 1, light: isLight(hex) });
  }
  distinguishShades(yarns);

  const rows: WrittenRow[] = [];
  for (let row = 0; row < height; row++) {
    // Even rows (RS) are worked right to left, odd rows (WS) left to right:
    // rowDirection and rowSide in the generator's cells.ts.
    const rs = row % 2 === 0;
    const runs: WrittenRow['runs'] = [];
    for (let k = 0; k < width; k++) {
      const col = rs ? width - 1 - k : k;
      const yarn = index.get(cells[row * width + col])!;
      const last = runs[runs.length - 1];
      if (last && last.yarn === yarn) last.count++;
      else runs.push({ yarn, count: 1 });
    }
    rows.push({ n: row + 1, side: rs ? 'RS' : 'WS', runs });
  }

  return { width, height, yarns, rows };
}
