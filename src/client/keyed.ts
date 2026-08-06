/**
 * Root-note picker: recomputes every diagram on the page (figure[data-spec])
 * with the same code as the generator, bundled by esbuild.
 */
import { parseNote } from '../theory/notes.js';
import { buildFigure, FigureSpec } from '../figures.js';
import { chordDiagramSVG, neckMapSVG } from '../render/svg.js';

const STORAGE_KEY = 'guitar-teacher-root';

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
    if (cells) {
      cells.innerHTML = diagrams
        .map(d => `<div class="diagram-cell">${chordDiagramSVG(d.voicing, { title: d.title })}
          <button class="play" data-notes="${d.voicing.notes.map(n => n.midi).join(',')}" aria-label="Listen to ${d.title}" title="Listen">▶</button>
        </div>`)
        .join('');
    }
  }
}

const select = document.getElementById('root-select') as HTMLSelectElement | null;
if (select) {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && [...select.options].some(o => o.value === saved)) {
    select.value = saved;
    if (saved !== 'C') applyRoot(saved);
  }
  select.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEY, select.value);
    applyRoot(select.value);
  });
}
