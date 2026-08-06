import { Voicing } from '../fretboard/fretboard.js';
import { FigureSpec, SongChord } from '../figures.js';
import { chordDiagramSVG, degreeLegendSVG, neckMapSVG } from './svg.js';

/**
 * One content block of a chapter — the teaching content is declarative.
 * `spec`, when present, describes the figure relative to the key: the site
 * embeds it as a data attribute to recompute diagrams client-side.
 */
export type Block =
  | { kind: 'html'; html: string }
  | { kind: 'legend' }
  | { kind: 'diagramRow'; title?: string; caption?: string; diagrams: { voicing: Voicing; title: string }[]; spec?: FigureSpec; strum?: boolean; song?: SongChord[]; video?: SongVideo }
  | { kind: 'neckMap'; title?: string; caption?: string; voicings: Voicing[]; maxFret?: number; spec?: FigureSpec }
  | { kind: 'exercise'; title: string; html: string }
  | { kind: 'tip'; html: string };

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

/** Lazy YouTube embed: nothing loads until the learner asks for it. */
function videoCta(video: SongVideo | undefined, interactive: boolean): string {
  if (!video || !interactive) return '';
  return `<div class="video-cta" data-yt="${video.id}" data-start="${video.start}" data-end="${video.end}">
    <button class="watch">🎬 Hear the record (${mmss(video.start)} – ${mmss(video.end)})</button>
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
      return `<figure class="diagram-row"${jsonAttr('spec', block.spec, interactive)}${jsonAttr('song', block.song, interactive)}>
        ${block.title ? `<h4>${block.title}</h4>` : ''}
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
