# guitar-teacher — Pick Three

Guitar method generator: computed fretboard diagrams (nothing drawn by hand),
PDF export **and** an interactive static site with audio.

The site is branded **Pick Three** — a plectrum carrying the three triad dots
(third and fifth on the shoulders, root at the tip), same colors as the
diagrams. Logo lives in `src/render/logo.ts` (mark + SVG favicon data URI).

```bash
npm install
npm run generate   # → output/triads.pdf + output/site/ (+ triads.html, print version)
npm run typecheck
```

The site (`output/site/index.html`) is 100% static: one page per chapter, and
every diagram plays — ▶ button (arpeggio then strummed chord, sequence for
neck maps), click any dot for the single note. Audio is synthesized in the
browser (Karplus-Strong plucked string, `player.js`); no audio files shipped.

Every chapter page has a **root-note picker**: figures carry their semantic
definition (`FigureSpec`, relative to the key) in a `data-spec` attribute, and
`keyed.js` — the music domain bundled as-is by esbuild — recomputes diagrams,
titles and audio client-side. Minor chords follow the relative minor
(C → Am, E → C♯m). The choice persists across pages (localStorage). Default
rendering (and the PDF): C.

## Architecture

- `src/theory/` — pure music domain: spelled notes (F♯ ≠ G♭), triads
  (major, minor, diminished, augmented), degrees.
- `src/fretboard/` — tuning, voicing computation: the three inversions of a
  triad on a 3-string set, along the neck.
- `src/figures.ts` — key-aware figure specs (`FigureSpec`) shared by the
  generator and the browser, including standard open chords.
- `src/render/` — SVG rendering (chord diagrams, neck maps, legend), HTML
  template + print CSS (A4, page breaks, boxes) and the site generator
  (`site.ts`: pages, screen CSS, audio player). SVG dots carry a `data-midi`
  attribute: inert in the PDF, playable on the site.
- `src/client/` — browser entry for the root-note picker (bundled to
  `keyed.js`).
- `src/pdf/` — export via headless Chrome (`puppeteer-core`, uses the
  system Chrome).
- `methods/` — the teaching content, declarative. `triads.ts` contains no
  fret coordinates: every diagram is computed from a spec.

## Writing a new method

Create a file in `methods/` exporting a `Method` object (see
`src/render/html.ts` for the block types: `html`, `diagramRow`, `neckMap`,
`exercise`, `tip`, `legend`) and wire it into `src/main.ts`.

Diagram color code: root red, third blue, fifth gray.
