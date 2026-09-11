// The soft half of the copy standard. The build already refuses anything in
// hardFailures(); this reports what a build must not enforce, because enforcing
// it would produce false positives and a gate people distrust gets disabled.
//
//   node scripts/check-copy.mjs            every pattern
//   node scripts/check-copy.mjs black-cat  one of them
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hardFailures, softWarnings, vocabularyOverlap } from '../src/data/copyRules.mjs';

const DIR = 'src/data/patterns';
const only = process.argv.slice(2);
const all = readdirSync(DIR).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')))
  .sort((a, b) => a.slug.localeCompare(b.slug));
const wanted = only.length ? all.filter((p) => only.includes(p.slug)) : all;

let hard = 0, soft = 0;
for (const p of wanted) {
  const lines = [];
  for (const lang of ['en', 'es']) {
    for (const m of hardFailures(lang, p.locales[lang])) { lines.push(`  FAIL  ${m}`); hard++; }
    for (const m of softWarnings(lang, p.locales[lang])) { lines.push(`  warn  ${m}`); soft++; }
  }
  if (lines.length) console.log(`${p.slug}\n${lines.join('\n')}`);
}

// Two descriptions over 45% shared vocabulary are competing for one query
// instead of covering two, which is the whole risk of publishing four cats.
const pairs = [];
for (const lang of ['en', 'es']) {
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const o = vocabularyOverlap(all[i].locales[lang].about, all[j].locales[lang].about);
      if (o > 0.45) pairs.push(`  warn  ${lang}: ${all[i].slug} and ${all[j].slug} share ${Math.round(o * 100)}% of their vocabulary`);
    }
  }
}
if (pairs.length) console.log(`vocabulary overlap\n${pairs.join('\n')}`);

console.log(`\n${wanted.length} patterns checked: ${hard} hard, ${soft + pairs.length} soft`);
process.exit(hard ? 1 : 0);
