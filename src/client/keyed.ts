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
  ChordRef,
  circleChords,
  CircleSpec,
  FigureDiagram,
  FigureSpec,
  positionLabel,
  progressionChordNames,
  progressionPositions,
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

/* ------------------------------------------------------------------ */
/*  Progression explorer (famous progressions)                         */
/*  Progression and chord set (key) are mandatory; the string set has  */
/*  a default (the 3 highest strings) and just re-voices the result.   */
/* ------------------------------------------------------------------ */

/** Available roots for the chord-set dropdown: same 12 keys, every progression. */
const ROOT_CHOICES: [string, string][] = [
  ['C', 'C'], ['Db', 'D♭'], ['D', 'D'], ['Eb', 'E♭'], ['E', 'E'], ['F', 'F'],
  ['F#', 'F♯'], ['G', 'G'], ['Ab', 'A♭'], ['A', 'A'], ['Bb', 'B♭'], ['B', 'B'],
];

const PSTRINGS_KEY = 'guitar-teacher-pstrings';

const explorer = document.querySelector<HTMLElement>('.progression-explorer');
if (explorer) {
  const progressions = JSON.parse(explorer.dataset.progressions!) as {
    id: string;
    label: string;
    blurb: string;
    chords: ChordRef[];
    keySongs: Record<string, string>;
  }[];
  const progSelect = explorer.querySelector<HTMLSelectElement>('#progression-select')!;
  const keySelect = explorer.querySelector<HTMLSelectElement>('#chordset-select')!;
  const pstringsRadios = [...document.querySelectorAll<HTMLInputElement>('input[name="pstrings"]')];
  const blurb = explorer.querySelector<HTMLElement>('#explorer-blurb')!;
  const keysong = explorer.querySelector<HTMLElement>('#explorer-keysong')!;
  const results = explorer.querySelector<HTMLElement>('#explorer-results')!;

  const currentSet = (): StringSet => {
    const value = pstringsRadios.find(r => r.checked)?.value ?? '3,2,1';
    return value.split(',').map(Number) as StringSet;
  };

  const rowHTML = (diagrams: FigureDiagram[], title: string): string => `
    <figure class="diagram-row">
      <h4>${title}</h4>
      <div class="row-play">
        <button class="play" data-seq="${JSON.stringify(diagrams.map(d => d.voicing.notes.map(n => n.midi))).replace(/"/g, '&quot;')}" aria-label="Play the whole row" title="Play the whole row">▶</button>
        <span>play the row</span>
      </div>
      <div class="diagram-cells">${cellsHTML(diagrams)}</div>
    </figure>`;

  const currentAllowed = (): (0 | 1 | 2)[] => {
    const level = currentLevel();
    return level === 'all' ? [0, 1, 2] : LEVELS[level].allowed;
  };

  function renderResults(): void {
    results.innerHTML = '';
    const prog = progressions.find(p => p.id === progSelect.value);
    if (!prog || !keySelect.value) return;
    const positions = progressionPositions(prog.chords, currentSet(), parseNote(keySelect.value), currentAllowed());
    results.innerHTML = positions
      .map((diagrams, i) => rowHTML(diagrams, positionLabel(i, positions.length)))
      .join('');
  }

  progSelect.addEventListener('change', () => {
    blurb.innerHTML = '';
    keysong.innerHTML = '';
    results.innerHTML = '';
    keySelect.innerHTML = '<option value="" selected disabled>Choose a chord set…</option>';
    const prog = progressions.find(p => p.id === progSelect.value);
    keySelect.disabled = !prog;
    if (!prog) return;
    blurb.innerHTML = prog.blurb;
    for (const [value, label] of ROOT_CHOICES) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = progressionChordNames(prog.chords, parseNote(value)).join(' – ');
      keySelect.appendChild(opt);
    }
  });

  keySelect.addEventListener('change', () => {
    const prog = progressions.find(p => p.id === progSelect.value);
    const song = prog?.keySongs[keySelect.value];
    keysong.innerHTML = song ? `🎵 ${song}` : '';
    renderResults();
  });

  if (pstringsRadios.length) {
    const saved = localStorage.getItem(PSTRINGS_KEY);
    if (saved && pstringsRadios.some(r => r.value === saved)) {
      pstringsRadios.forEach(r => { r.checked = r.value === saved; });
    }
    for (const radio of pstringsRadios) {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        localStorage.setItem(PSTRINGS_KEY, radio.value);
        renderResults();
      });
    }
  }

  // The shared level picker (wired below) already persists the choice and
  // re-voices song excerpts — it also re-voices this explorer's results.
  for (const radio of levelRadios) {
    radio.addEventListener('change', () => { if (radio.checked) renderResults(); });
  }
}
