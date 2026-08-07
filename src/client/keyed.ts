/**
 * Client-side page controls, bundled by esbuild with the same domain code
 * as the generator:
 * - root-note picker: recomputes keyed figures (figure[data-spec]);
 * - level picker: re-voices song excerpts (figure[data-song]) within the
 *   inversions the learner has studied so far.
 */
import { parseNote } from '../theory/notes.js';
import {
  buildFigure,
  circleChords,
  CircleSpec,
  FigureDiagram,
  FigureSpec,
  SongChord,
  songDiagrams,
} from '../figures.js';
import { StringSet } from '../fretboard/fretboard.js';
import { chordDiagramSVG, neckMapSVG } from '../render/svg.js';

function cellsHTML(diagrams: FigureDiagram[], { strum = false } = {}): string {
  return diagrams
    .map(d => `<div class="diagram-cell">${chordDiagramSVG(d.voicing, { title: d.title })}
      <button class="play" data-notes="${d.voicing.notes.map(n => n.midi).join(',')}"${strum ? ' data-strum' : ''} aria-label="Listen to ${d.title}" title="Listen">▶</button>
    </div>`)
    .join('');
}

/* ------------------------------------------------------------------ */
/*  Root-note picker (keyed figures)                                   */
/* ------------------------------------------------------------------ */

const ROOT_KEY = 'guitar-teacher-root';

function applyRoot(rootName: string): void {
  const root = parseNote(rootName);

  for (const figure of document.querySelectorAll<HTMLElement>('figure[data-spec]')) {
    const spec = JSON.parse(figure.dataset.spec!) as FigureSpec;
    const diagrams = buildFigure(spec, root);

    // Some figures don't exist in every key (e.g. open chords):
    // hide them rather than showing an empty box.
    figure.style.display = diagrams.length ? '' : 'none';
    if (!diagrams.length) continue;

    const scroll = figure.querySelector('.neck-map-scroll');
    if (scroll) {
      scroll.innerHTML = neckMapSVG(diagrams.map(d => d.voicing));
      const button = figure.querySelector<HTMLButtonElement>('button.play[data-seq]');
      if (button) {
        button.dataset.seq = JSON.stringify(diagrams.map(d => d.voicing.notes.map(n => n.midi)));
      }
      continue;
    }

    const cells = figure.querySelector('.diagram-cells');
    if (cells) cells.innerHTML = cellsHTML(diagrams);
  }
}

const rootSelect = document.getElementById('root-select') as HTMLSelectElement | null;
if (rootSelect) {
  const saved = localStorage.getItem(ROOT_KEY);
  if (saved && [...rootSelect.options].some(o => o.value === saved)) {
    rootSelect.value = saved;
    if (saved !== 'C') applyRoot(saved);
  }
  rootSelect.addEventListener('change', () => {
    localStorage.setItem(ROOT_KEY, rootSelect.value);
    applyRoot(rootSelect.value);
  });
}

/* ------------------------------------------------------------------ */
/*  Level picker (song excerpts)                                       */
/* ------------------------------------------------------------------ */

const LEVEL_KEY = 'guitar-teacher-level';
const STRINGS_KEY = 'guitar-teacher-strings';

type Level = 'all' | 'root' | 'root1';
const LEVELS: Record<Exclude<Level, 'all'>, {
  allowed: (0 | 1 | 2)[];
  badge: string;
  caption: string;
}> = {
  root: {
    allowed: [0],
    badge: 'root position only',
    caption: 'Adapted: every chord in root position, nearest to the previous one. '
      + 'Notice the extra hand travel compared to the full version — that is exactly what inversions buy you.',
  },
  root1: {
    allowed: [0, 1],
    badge: 'root + 1st inversion',
    caption: 'Adapted: root position and 1st inversion only, each chord nearest to the previous one. '
      + 'Compare with the full version to see what the 2nd inversion would save.',
  },
};

/** Which string sets the circle drill may rotate through. */
type Strings = 'top' | 'treble' | 'all';
const STRING_POOLS: Record<Strings, { sets: StringSet[]; badge: string }> = {
  top: { sets: [[3, 2, 1]], badge: 'top strings only' },
  treble: { sets: [[3, 2, 1], [4, 3, 2]], badge: '' }, // default pool
  all: { sets: [[3, 2, 1], [4, 3, 2], [5, 4, 3], [6, 5, 4]], badge: 'all four string sets' },
};

const levelRadios = [...document.querySelectorAll<HTMLInputElement>('input[name="level"]')];
const stringsRadios = [...document.querySelectorAll<HTMLInputElement>('input[name="strings"]')];

const currentLevel = (): Level =>
  (levelRadios.find(r => r.checked)?.value as Level) ?? 'all';
const currentStrings = (): Strings =>
  (stringsRadios.find(r => r.checked)?.value as Strings) ?? 'treble';

/** Original markup of each song figure, captured before the first adaptation. */
const originals = new Map<HTMLElement, { cells: string; caption: string | null; seq: string | null }>();

function applyState(): void {
  const level = currentLevel();
  const strings = currentStrings();

  for (const figure of document.querySelectorAll<HTMLElement>('figure[data-song]')) {
    const cells = figure.querySelector('.diagram-cells')!;
    const caption = figure.querySelector('figcaption');
    const rowButton = figure.querySelector<HTMLButtonElement>('.row-play button.play');
    if (!originals.has(figure)) {
      originals.set(figure, {
        cells: cells.innerHTML,
        caption: caption?.innerHTML ?? null,
        seq: rowButton?.dataset.seq ?? null,
      });
    }
    figure.querySelector('.adapted-badge')?.remove();

    // Only circle drills respond to the strings picker
    const circle = figure.dataset.circle
      ? JSON.parse(figure.dataset.circle) as CircleSpec
      : null;
    const isDefault = level === 'all' && (!circle || strings === 'treble');

    if (isDefault) {
      const original = originals.get(figure)!;
      cells.innerHTML = original.cells;
      if (caption && original.caption !== null) caption.innerHTML = original.caption;
      if (rowButton && original.seq !== null) rowButton.dataset.seq = original.seq;
      continue;
    }

    const allowed = level === 'all' ? ([0, 1, 2] as (0 | 1 | 2)[]) : LEVELS[level].allowed;
    const chords = circle
      ? circleChords(circle, STRING_POOLS[strings].sets)
      : JSON.parse(figure.dataset.song!) as SongChord[];
    const diagrams = songDiagrams(chords, allowed);
    cells.innerHTML = cellsHTML(diagrams, { strum: true });
    if (rowButton) {
      rowButton.dataset.seq = JSON.stringify(diagrams.map(d => d.voicing.notes.map(n => n.midi)));
    }
    // Some captions are written to cover every level — leave those alone
    if (caption && level !== 'all' && !figure.hasAttribute('data-keep-caption')) {
      caption.textContent = LEVELS[level].caption;
    }
    const badgeParts = [
      ...(level !== 'all' ? [LEVELS[level].badge] : []),
      ...(circle && strings !== 'treble' ? [STRING_POOLS[strings].badge] : []),
    ];
    figure.insertAdjacentHTML('afterbegin',
      `<div class="adapted-badge">adapted · ${badgeParts.join(' · ')}</div>`);
  }
}

/* ------------------------------------------------------------------ */
/*  Lazy YouTube excerpts (song sections)                              */
/* ------------------------------------------------------------------ */

document.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest('.video-cta button.watch');
  if (!button) return;
  const cta = button.closest<HTMLElement>('.video-cta')!;
  const { yt, start, end } = cta.dataset;
  const src = `https://www.youtube-nocookie.com/embed/${yt}?start=${start}&end=${end}&autoplay=1&rel=0`;
  // The button becomes the player; the "Open on YouTube" link stays as a
  // fallback (embeds require an HTTP origin — they fail on file://).
  button.outerHTML = `<iframe src="${src}" title="Song excerpt"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
});

function wireRadios(radios: HTMLInputElement[], storageKey: string, valid: string[]): void {
  if (!radios.length) return;
  const saved = localStorage.getItem(storageKey);
  if (saved && valid.includes(saved)) {
    radios.forEach(r => { r.checked = r.value === saved; });
  }
  for (const radio of radios) {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      localStorage.setItem(storageKey, radio.value);
      applyState();
    });
  }
}

wireRadios(levelRadios, LEVEL_KEY, ['all', 'root', 'root1']);
wireRadios(stringsRadios, STRINGS_KEY, ['top', 'treble', 'all']);
if (levelRadios.length || stringsRadios.length) applyState();
