# Publishing a pattern

```bash
npm run publish-pattern -- --slug <slug> --tags tapestry,animals,beginner
# fill in seoDesc / about / bullets in src/data/patterns/<slug>.json
npm run publish-pattern -- --slug <slug> --deploy
```

`add-pattern.mjs` installs the export from Tapestry Studio: it copies and
renames the assets, renders the catalog preview from the chart itself, updates
`public/patterns/index.json`, and writes `src/data/patterns/<slug>.json`.

Only three fields per language are written by a person. Everything else about a
pattern follows from its slug and its dimensions and is derived in
`src/data/patterns.ts`, so there is one place a stitch count or a licence line
can be wrong instead of one per pattern.

Two guards worth knowing about:

- It will not overwrite a published asset with a different one without
  `--force`. That is aimed at the PDFs: the generator's local copies are the
  plain export while the published ones carry the QR and the licence.
- The site build fails if a pattern's copy is empty, so a stub cannot ship with
  a blank description.

The signature on the `.rcpattern` is not verified here. That needs the signing
key and this repo is public, so it lives in the generator's private repo:
`node scripts/verify-pattern.mjs patterns/<slug>/<slug>.rcpattern`.

# Chart images for Ravelry

```bash
npm run ravelry-images                        # all of them, catalog order
npm run ravelry-images -- --slug spooky-mothman
```

`render-ravelry.mjs` writes two PNGs per pattern into `ravelry/` (git-ignored,
they are upload artefacts): `(art)` is flat colour blocks, `(chart)` is the same
chart with a countable grid, heavy every tenth stitch. Neither carries a title,
a logo or a badge — Ravelry is not Pinterest, a listing photo with marketing
text burned into it reads as an ad there, and the first photo is the search
thumbnail.

Both are rendered from the published `.rcpattern`, so they cannot disagree with
the file people download. Re-run it after re-publishing a pattern.

The long side lands near 1400 px at an integer number of pixels per stitch.
Scaling to an exact image size instead leaves some stitches a pixel wider than
their neighbours, which on a chart reads as an error in the chart.
