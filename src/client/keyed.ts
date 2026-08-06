/**
 * Client-side page controls, bundled by esbuild with the same domain code
 * as the generator:
 * - root-note picker: recomputes keyed figures (figure[data-spec]);
 * - level picker: re-voices song excerpts (figure[data-song]) within the
 *   inversions the learner has studied so far.
 */
import { parseNote } from '../theory/notes.js';
import { buildFigure, FigureDiagram, FigureSpec, SongChord, songDiagrams } from '../figures.js';
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

type Level = 'all' | 'root' | 'root1';
const LEVELS: Record<Exclude<Level, 'all'>, {
  allowed: (0 | 1 | 2)[];
  badge: string;
  caption: string;
}> = {
  root: {
    allowed: [0],
    badge: 'adapted · root position only',
    caption: 'Adapted: every chord in root position, nearest to the previous one. '
      + 'Notice the extra hand travel compared to the record — that is exactly what inversions buy you.',
  },
  root1: {
    allowed: [0, 1],
    badge: 'adapted · root + 1st inversion',
    caption: 'Adapted: root position and 1st inversion only, each chord nearest to the previous one. '
      + 'Compare with the record to see what the 2nd inversion would save.',
  },
};

/** Original markup of each song figure, captured before the first adaptation. */
const originals = new Map<HTMLElement, { cells: string; caption: string | null }>();

function applyLevel(level: Level): void {
  for (const figure of document.querySelectorAll<HTMLElement>('figure[data-song]')) {
    const cells = figure.querySelector('.diagram-cells')!;
    const caption = figure.querySelector('figcaption');
    if (!originals.has(figure)) {
      originals.set(figure, { cells: cells.innerHTML, caption: caption?.innerHTML ?? null });
    }
    figure.querySelector('.adapted-badge')?.remove();

    if (level === 'all') {
      const original = originals.get(figure)!;
      cells.innerHTML = original.cells;
      if (caption && original.caption !== null) caption.innerHTML = original.caption;
      continue;
    }

    const { allowed, badge, caption: captionText } = LEVELS[level];
    const chords = JSON.parse(figure.dataset.song!) as SongChord[];
    cells.innerHTML = cellsHTML(songDiagrams(chords, allowed), { strum: true });
    if (caption) caption.textContent = captionText;
    figure.insertAdjacentHTML('afterbegin', `<div class="adapted-badge">${badge}</div>`);
  }
}

const levelRadios = [...document.querySelectorAll<HTMLInputElement>('input[name="level"]')];
if (levelRadios.length) {
  const saved = localStorage.getItem(LEVEL_KEY) as Level | null;
  if (saved && (saved === 'all' || saved in LEVELS)) {
    levelRadios.forEach(r => { r.checked = r.value === saved; });
    if (saved !== 'all') applyLevel(saved);
  }
  for (const radio of levelRadios) {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      localStorage.setItem(LEVEL_KEY, radio.value);
      applyLevel(radio.value as Level);
    });
  }
}
