// A 5 x 7 bitmap for every symbol the chart legend can use.
//
// Drawn here rather than set in a real typeface because the alternative is
// rasterising text, which means driving a browser: a second toolchain, a font
// that has to exist on the machine, and output that changes with the Chrome
// version. At the size a chart cell gives you, three pixels a stroke, a hinted
// bitmap is also simply more legible than an antialiased glyph.
//
// The order matches SYMBOLS in the generator's exportPdf.ts. The symbol a
// colour gets is its position in first-appearance order through the chart, so a
// pattern's Nth colour must land on the same character here as it does in the
// PDF legend, or the image and the PDF disagree about what a cell means.
export const GLYPH_ORDER = [
  'X', 'O', '+', '*', '/', '\\', '=', '#', '%', '@', '&', '<', '>', '?', 'S', 'Z',
  'T', 'V', 'L', 'C', 'U', 'N', 'H', 'K',
];

export const GLYPHS = {
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '*': ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '\\': ['#....', '#....', '.#...', '..#..', '...#.', '....#', '....#'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '&': ['.##..', '#..#.', '#.#..', '.##..', '#..#.', '#..#.', '.##.#'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;

/** The symbol for the colour at `index` in first-appearance order. */
export function symbolAt(index) {
  return GLYPH_ORDER[index % GLYPH_ORDER.length];
}
