#!/usr/bin/env node
// Builds the public Tapestry Studio and copies it to public/studio/app/, which
// Astro serves as-is. The Studio lives in its own private repo, so its built
// files are committed here; that is what GitHub Pages deploys.
//
//   npm run sync-studio
//   STUDIO_DIR=/path/to/tapestry-studio npm run sync-studio
//
// It refuses to copy a bundle that contains the .rcpattern signing key or the
// repo's chart files. The public build swaps those modules for stubs; this is
// the check that the swap still holds after a refactor.

import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const studioDir = resolve(process.env.STUDIO_DIR ?? join(homedir(), 'Desktop/Count Row App/tapestry-studio'));
const outDir = join(studioDir, 'dist-public');
const target = resolve('public/studio/app');

if (!existsSync(join(studioDir, 'package.json'))) {
  console.error(`Tapestry Studio not found at ${studioDir}. Set STUDIO_DIR.`);
  process.exit(1);
}

// vite directly, not `npm run build:public`: its tsc step type-checks
// vite.config.ts, which fails on missing @types/node in that repo.
execSync('npx vite build --mode public', { cwd: studioDir, stdio: 'inherit' });

const FORBIDDEN = [/nrc\.rcpattern/, /\.tapestry\.json/];
function scan(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(js|html|css)$/.test(name)) continue;
    const text = readFileSync(p, 'utf8');
    const hit = FORBIDDEN.find((re) => re.test(text));
    if (hit) {
      console.error(`Refusing to publish: ${p} matches ${hit}. The public build is leaking internal code.`);
      process.exit(1);
    }
  }
}
scan(outDir);

rmSync(target, { recursive: true, force: true });
cpSync(outDir, target, { recursive: true });
console.log(`Studio copied to ${target}`);
