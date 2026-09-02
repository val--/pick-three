import { StringSet, Voicing } from '../fretboard/fretboard.js';
import { parseNote } from '../theory/notes.js';
import { ChordRef, CircleSpec, FigureSpec, positionLabel, progressionPositions, SongChord } from '../figures.js';
import { chordDiagramSVG, degreeLegendSVG, neckMapSVG } from './svg.js';

/**
 * One content block of a chapter — the teaching content is declarative.
 * `spec`, when present, describes the figure relative to the key: the site
 * embeds it as a data attribute to recompute diagrams client-side.
 */
export type Block =
  | { kind: 'html'; html: string }
  | { kind: 'legend' }
  | { kind: 'diagramRow'; title?: string; caption?: string; diagrams: { voicing: Voicing; title: string }[]; spec?: FigureSpec; strum?: boolean; song?: SongChord[]; video?: SongVideo;
      /** Keep the caption when the level picker re-voices the row (caption written for all levels). */
      keepCaption?: boolean;
      /** Circle drill data: lets the site's strings picker rebuild the row over another set pool. */
      circle?: CircleSpec }
  | { kind: 'neckMap'; title?: string; caption?: string; voicings: Voicing[]; maxFret?: number; spec?: FigureSpec }
  | { kind: 'exercise'; title: string; html: string }
  | { kind: 'tip'; html: string }
  /**
   * Two mandatory dropdowns — progression, then chord set (key) — plus a
   * string-set dropdown (defaulting to the 3 highest strings) that reveal
   * up to 3 voice-led positions for the chosen combination. Nothing is
   * pre-rendered for the site: the site builds it client-side once a
   * progression and a chord set are chosen. The static PDF instead shows
   * every progression at its default key and string set, all of its
   * positions, one after another.
   */
  | { kind: 'progressionExplorer'; progressions: ProgressionDef[] };

export interface ProgressionDef {
  id: string;
  /** Roman-numeral formula, e.g. "i – ♭VII – ♭III – ♭VI". */
  label: string;
  /** Short intro HTML shown once the progression is picked (or, in print, above its diagrams). */
  blurb: string;
  chords: ChordRef[];
  /** Key used for the static PDF rendering only. */
  defaultRoot: string;
  /** Real song known to use this exact chord set in this exact key — shown once that root is picked. */
  keySongs?: Record<string, string>;
}

/** The 4 string sets a progression can be voiced on, highest-pitched first (the site's default). */
export const STRING_SET_CHOICES: [string, StringSet, string][] = [
  ['3,2,1', [3, 2, 1], 'Strings 3-2-1 (highest)'],
  ['4,3,2', [4, 3, 2], 'Strings 4-3-2'],
  ['5,4,3', [5, 4, 3], 'Strings 5-4-3'],
  ['6,5,4', [6, 5, 4], 'Strings 6-5-4 (lowest)'],
];

export interface Chapter {
  title: string;
  intro?: string;
  /** Highlights the chapter on the site's table of contents (accent border). */
  featured?: boolean;
  blocks: Block[];
}

export interface Method {
  title: string;
  subtitle?: string;
  volume?: string;
  chapters: Chapter[];
}

/** YouTube excerpt: only the [start, end] window that contains the triads. */
export interface SongVideo {
  id: string;
  start: number;
  end: number;
}

const midiOf = (v: Voicing) => v.notes.map(n => n.midi).join(',');

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Lazy YouTube embed: nothing loads until the learner asks for it. The
 * plain YouTube link stays as a fallback — embeds refuse to play without
 * an HTTP origin (error 153 on file://).
 */
function videoCta(video: SongVideo | undefined, interactive: boolean): string {
  if (!video || !interactive) return '';
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}&t=${video.start}s`;
  return `<div class="video-cta" data-yt="${video.id}" data-start="${video.start}" data-end="${video.end}">
    <button class="watch">🎬 Hear the record (${mmss(video.start)} – ${mmss(video.end)})</button>
    <a class="video-link" href="${watchUrl}" target="_blank" rel="noopener">Open on YouTube ↗</a>
  </div>`;
}

const jsonAttr = (name: string, value: unknown, interactive: boolean) =>
  interactive && value ? ` data-${name}="${JSON.stringify(value).replace(/"/g, '&quot;')}"` : '';

/**
 * Renders one block. In `interactive` mode (the site), diagrams get a listen
 * button carrying the MIDI pitches as data attributes; the site's audio
 * player (player.js) does the rest.
 */
export function renderBlock(block: Block, { interactive = false } = {}): string {
  switch (block.kind) {
    case 'html':
      return block.html;
    case 'legend':
      return `<div class="legend">${degreeLegendSVG()}</div>`;
    case 'diagramRow': {
      // strum: play the chord directly (song excerpts) instead of the
      // teaching arpeggio-then-strum
      const strumAttr = block.strum ? ' data-strum' : '';
      const cells = block.diagrams
        .map(d => `<div class="diagram-cell">${chordDiagramSVG(d.voicing, { title: d.title })}
          ${interactive ? `<button class="play" data-notes="${midiOf(d.voicing)}"${strumAttr} aria-label="Listen to ${d.title}" title="Listen">▶</button>` : ''}
        </div>`)
        .join('');
      // Song/workout rows get a "play the whole row" sequence button
      const rowSeq = block.song && interactive
        ? `<div class="row-play">
            <button class="play" data-seq="${JSON.stringify(block.diagrams.map(d => d.voicing.notes.map(n => n.midi))).replace(/"/g, '&quot;')}" aria-label="Play the whole row" title="Play the whole row">▶</button>
            <span>play the row</span>
          </div>`
        : '';
      return `<figure class="diagram-row"${jsonAttr('spec', block.spec, interactive)}${jsonAttr('song', block.song, interactive)}${jsonAttr('circle', block.circle, interactive)}${interactive && block.keepCaption ? ' data-keep-caption' : ''}>
        ${block.title ? `<h4>${block.title}</h4>` : ''}
        ${rowSeq}
        <div class="diagram-cells">${cells}</div>
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
        ${videoCta(block.video, interactive)}
      </figure>`;
    }
    case 'neckMap': {
      const seq = block.voicings.map(v => v.notes.map(n => n.midi));
      return `<figure class="neck-map"${jsonAttr('spec', block.spec, interactive)}>
        ${block.title ? `<h4>${block.title}</h4>` : ''}
        ${interactive ? `<button class="play" data-seq="${JSON.stringify(seq).replace(/"/g, '&quot;')}" aria-label="Play the sequence" title="Play the sequence">▶</button>` : ''}
        <div class="neck-map-scroll">${neckMapSVG(block.voicings, { maxFret: block.maxFret ?? 15 })}</div>
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
      </figure>`;
    }
    case 'exercise':
      return `<div class="exercise">
        <div class="exercise-label">Exercise</div>
        <h4>${block.title}</h4>
        ${block.html}
      </div>`;
    case 'tip':
      return `<div class="tip">${block.html}</div>`;
    case 'progressionExplorer': {
      if (!interactive) {
        // Static book rendering: every progression, at its default key and string set, every position.
        const defaultSet = STRING_SET_CHOICES[0][1];
        return block.progressions
          .map(p => {
            const positions = progressionPositions(p.chords, defaultSet, parseNote(p.defaultRoot));
            const rows = positions
              .map((diagrams, i) => {
                const cells = diagrams
                  .map(d => `<div class="diagram-cell">${chordDiagramSVG(d.voicing, { title: d.title })}</div>`)
                  .join('');
                return `<h4>${positionLabel(i, positions.length)}</h4><div class="diagram-cells">${cells}</div>`;
              })
              .join('\n');
            const keySong = p.keySongs?.[p.defaultRoot];
            const keySongHtml = keySong ? `<p class="keysong">🎵 ${keySong}</p>` : '';
            return `${p.blurb}${keySongHtml}${rows}`;
          })
          .join('\n');
      }
      const payload = JSON.stringify(
        block.progressions.map(p => ({
          id: p.id, label: p.label, blurb: p.blurb, chords: p.chords, keySongs: p.keySongs ?? {},
        })),
      ).replace(/"/g, '&quot;');
      const options = block.progressions.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
      return `<div class="progression-explorer" data-progressions="${payload}">
        <div class="explorer-controls">
          <label>Progression
            <select id="progression-select">
              <option value="" selected disabled>Choose a progression…</option>
              ${options}
            </select>
          </label>
          <label>Chord set
            <select id="chordset-select" disabled>
              <option value="" selected disabled>Choose a chord set…</option>
            </select>
          </label>
        </div>
        <div id="explorer-blurb"></div>
        <div id="explorer-keysong"></div>
        <div id="explorer-results"></div>
      </div>`;
    }
  }
}

export function renderMethod(method: Method): string {
  const toc = method.chapters
    .map((c, i) => `<li><span class="toc-num">${i + 1}</span> ${c.title}</li>`)
    .join('\n');

  const chapters = method.chapters
    .map(
      (c, i) => `<section class="chapter">
      <header class="chapter-header">
        <div class="chapter-num">Chapter ${i + 1}</div>
        <h2>${c.title}</h2>
      </header>
      ${c.intro ? `<p class="chapter-intro">${c.intro}</p>` : ''}
      ${c.blocks.map(b => renderBlock(b)).join('\n')}
    </section>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${method.title}</title>
<style>${CSS}</style>
</head>
<body>
  <section class="cover">
    <div class="cover-rule"></div>
    <h1>${method.title}</h1>
    ${method.subtitle ? `<p class="cover-subtitle">${method.subtitle}</p>` : ''}
    ${method.volume ? `<p class="cover-volume">${method.volume}</p>` : ''}
    <div class="cover-rule"></div>
  </section>

  <section class="toc">
    <h2>Contents</h2>
    <ul>${toc}</ul>
  </section>

  ${chapters}
</body>
</html>`;
}

const CSS = /* css */ `
  @page {
    size: A4;
    margin: 20mm 18mm 22mm 18mm;
  }

  * { box-sizing: border-box; }

  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #2c3e50;
    font-size: 11.5pt;
    line-height: 1.55;
    margin: 0;
  }

  h1, h2, h3, h4, .chapter-num, .exercise-label {
    font-family: Helvetica, Arial, sans-serif;
  }

  /* ---- Cover ---- */
  .cover {
    height: 240mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    break-after: page;
  }
  .cover h1 { font-size: 34pt; margin: 10mm 0 4mm; letter-spacing: -0.5pt; }
  .cover-subtitle { font-size: 14pt; font-style: italic; color: #5d6d7e; margin: 0; }
  .cover-volume {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10.5pt; text-transform: uppercase; letter-spacing: 2pt;
    color: #c0392b; margin-top: 14mm;
  }
  .cover-rule { width: 42mm; height: 1.2pt; background: #c0392b; margin: 0 auto; }

  /* ---- Contents ---- */
  .toc { break-after: page; }
  .toc h2 { font-size: 19pt; margin-bottom: 8mm; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { font-size: 12.5pt; padding: 2.6mm 0; border-bottom: 0.5pt solid #d5d8dc; }
  .toc-num {
    display: inline-block; width: 9mm; color: #c0392b;
    font-family: Helvetica, Arial, sans-serif; font-weight: 700;
  }

  /* ---- Chapters ---- */
  .chapter { break-before: page; }
  .chapter-header { border-bottom: 2pt solid #2c3e50; padding-bottom: 3mm; margin-bottom: 6mm; }
  .chapter-num {
    font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1.5pt;
    color: #c0392b; font-weight: 700; margin-bottom: 1mm;
  }
  .chapter h2 { font-size: 20pt; margin: 0; }
  .chapter-intro { font-size: 12pt; font-style: italic; color: #5d6d7e; }
  h3 { font-size: 13.5pt; margin: 7mm 0 3mm; }
  h4 { font-size: 11pt; margin: 0 0 2mm; }

  /* ---- Diagrams ---- */
  figure { margin: 5mm 0; break-inside: avoid; }
  .diagram-cells {
    display: flex; flex-wrap: wrap; gap: 6mm 7mm;
    justify-content: flex-start; align-items: flex-end;
  }
  figcaption { font-size: 9.5pt; color: #5d6d7e; font-style: italic; margin-top: 2mm; }
  .neck-map svg { max-width: 100%; height: auto; }
  .legend { margin: 3mm 0 5mm; }

  /* ---- Boxes ---- */
  .exercise {
    border: 0.8pt solid #2c3e50; border-left: 3pt solid #c0392b;
    padding: 4mm 5mm; margin: 5mm 0; break-inside: avoid;
    background: #fdfefe;
  }
  .exercise-label {
    font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.5pt;
    color: #c0392b; font-weight: 700; margin-bottom: 1.5mm;
  }
  .exercise h4 { font-size: 12pt; margin-bottom: 2mm; }
  .exercise p, .exercise ol, .exercise ul { margin: 1.5mm 0; }

  .tip {
    background: #f4f6f7; border-radius: 2mm;
    padding: 3.5mm 5mm; margin: 5mm 0; break-inside: avoid;
    font-size: 10.5pt;
  }
  .tip::before {
    content: 'Remember';
    display: block;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.5pt;
    color: #2874a6; font-weight: 700; margin-bottom: 1.5mm;
  }

  .songs-teaser {
    border: 0.8pt solid #c0392b; border-radius: 2mm;
    padding: 3.5mm 5mm; margin: 5mm 0; break-inside: avoid;
    font-size: 10.5pt;
  }
  .songs-teaser a { color: #c0392b; font-weight: 700; text-decoration: none; }

  table { border-collapse: collapse; width: 100%; margin: 4mm 0; font-size: 10.5pt; }
  th, td { border: 0.5pt solid #b0bec5; padding: 1.8mm 3mm; text-align: left; }
  th { font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; background: #f4f6f7; }
`;
