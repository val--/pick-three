import { Chapter, Method, renderBlock } from './html.js';
import { faviconDataUri, pickMark } from './logo.js';

const SITE_NAME = 'Pick Three';
const BRAND_HTML = `Pick <span class="accent">Three</span>`;

export interface SiteFile {
  /** Path relative to the site directory (e.g. "chapter-2.html"). */
  path: string;
  content: string;
}

const chapterFile = (i: number) => `chapter-${i + 1}.html`;

function page(method: Method, title: string, current: number | null, body: string): string {
  const nav = method.chapters
    .map((c, i) => `<a href="${chapterFile(i)}" ${i === current ? 'class="current"' : ''} title="${c.title}">${i + 1}</a>`)
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${SITE_NAME}</title>
<link rel="icon" href="${faviconDataUri()}">
<link rel="stylesheet" href="site.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.html">${pickMark(24, { withLabels: false })}<span>${BRAND_HTML}</span></a>
    <nav class="chapters" aria-label="Chapters">${nav}</nav>
  </header>
  <main>${body}</main>
  <footer class="site-footer">
    <p>${SITE_NAME} · ${method.title} — a generated method. All audio is synthesized
      in your browser: click ▶ or any dot.</p>
  </footer>
  <script src="player.js"></script>
  <script src="keyed.js"></script>
</body>
</html>`;
}

/** Available roots: ASCII value for parseNote, unicode label. */
const ROOT_CHOICES: [string, string][] = [
  ['C', 'C'], ['Db', 'D♭'], ['D', 'D'], ['Eb', 'E♭'], ['E', 'E'], ['F', 'F'],
  ['F#', 'F♯'], ['G', 'G'], ['Ab', 'A♭'], ['A', 'A'], ['Bb', 'B♭'], ['B', 'B'],
];

function keyPicker(): string {
  const options = ROOT_CHOICES
    .map(([value, label]) => `<option value="${value}"${value === 'C' ? ' selected' : ''}>${label}</option>`)
    .join('');
  return `<div class="key-picker">
    <label for="root-select">Root note:</label>
    <select id="root-select">${options}</select>
    <span class="key-hint">every diagram on this page adapts — the text keeps its examples in C</span>
  </div>`;
}

/** Radio pills adapting song excerpts to how far the learner has read. */
function levelPicker(): string {
  const options: [string, string, string, boolean][] = [
    ['root', 'Root position only', 'chapter 2', false],
    ['root1', 'Root + 1st inversion', 'chapter 3', false],
    ['all', 'As recorded', 'chapter 4+', true],
  ];
  const pills = options
    .map(([value, label, hint, checked]) =>
      `<label><input type="radio" name="level" value="${value}"${checked ? ' checked' : ''}>
        ${label} <em>(${hint})</em></label>`)
    .join('');
  return `<div class="level-picker">
    <span class="level-label">🎓 Adapt to your level:</span>
    <div class="level-options" role="radiogroup" aria-label="Adapt to your level">${pills}</div>
  </div>`;
}

function chapterPage(method: Method, index: number): string {
  const c = method.chapters[index];
  const prev = index > 0 ? method.chapters[index - 1] : null;
  const next = index < method.chapters.length - 1 ? method.chapters[index + 1] : null;
  const hasKeyedFigures = c.blocks.some(b => 'spec' in b && b.spec);
  const hasSongFigures = c.blocks.some(b => b.kind === 'diagramRow' && b.song);

  const body = `<article class="chapter">
    <header class="chapter-header">
      <div class="chapter-num">Chapter ${index + 1}</div>
      <h1>${c.title}</h1>
    </header>
    ${hasKeyedFigures ? keyPicker() : ''}
    ${hasSongFigures ? levelPicker() : ''}
    ${c.intro ? `<p class="chapter-intro">${c.intro}</p>` : ''}
    ${c.blocks.map(b => renderBlock(b, { interactive: true })).join('\n')}
    <nav class="pager">
      ${prev ? `<a class="prev" href="${chapterFile(index - 1)}">← ${prev.title}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="${chapterFile(index + 1)}">${next.title} →</a>` : `<a class="next" href="index.html">Contents →</a>`}
    </nav>
  </article>`;

  return page(method, `Chapter ${index + 1}`, index, body);
}

function indexPage(method: Method): string {
  const toc = method.chapters
    .map(
      (c, i) => `<li><a href="${chapterFile(i)}"${c.featured ? ' class="toc-featured"' : ''}>
        <span class="toc-num">${i + 1}</span>
        <span class="toc-title">${c.title}</span>
        ${c.intro ? `<span class="toc-intro">${c.intro}</span>` : ''}
      </a></li>`,
    )
    .join('\n');

  const body = `<section class="hero">
    <div class="hero-brand">
      ${pickMark(56)}
      <div>
        <h1>${BRAND_HTML}</h1>
        <p class="hero-tagline">Master the guitar neck, three notes at a time.</p>
      </div>
    </div>
    <p class="hero-method-line"><strong>${method.title}</strong>${method.volume ? ` · ${method.volume}` : ''}</p>
  </section>
  <ol class="toc">${toc}</ol>`;

  return page(method, 'Contents', null, body);
}

export function renderSite(method: Method): SiteFile[] {
  return [
    { path: 'index.html', content: indexPage(method) },
    ...method.chapters.map((_: Chapter, i: number) => ({ path: chapterFile(i), content: chapterPage(method, i) })),
    { path: 'site.css', content: SITE_CSS },
    { path: 'player.js', content: PLAYER_JS },
  ];
}

/* ------------------------------------------------------------------ */
/*  Screen CSS                                                         */
/* ------------------------------------------------------------------ */

const SITE_CSS = /* css */ `
* { box-sizing: border-box; }

:root {
  --ink: #2c3e50;
  --faded: #5d6d7e;
  --accent: #c0392b;
  --blue: #2874a6;
  --paper: #faf9f7;
  --line: #e3e0da;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 17px;
  line-height: 1.65;
}

h1, h2, h3, h4, .chapter-num, .exercise-label, .brand, .chapters, .toc-num {
  font-family: Helvetica, Arial, sans-serif;
}

/* ---- Top bar ---- */
.topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 10px 22px;
  background: rgba(250, 249, 247, 0.92);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
}
.brand {
  display: flex; align-items: center; gap: 9px;
  color: var(--ink); text-decoration: none; font-weight: 700;
  font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px;
}
.brand svg { display: block; }
.accent { color: var(--accent); }
.chapters { display: flex; gap: 6px; }
.chapters a {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 50%;
  color: var(--faded); text-decoration: none; font-weight: 700; font-size: 13px;
  border: 1.5px solid transparent;
}
.chapters a:hover { border-color: var(--accent); color: var(--accent); }
.chapters a.current { background: var(--accent); color: #fff; }

main { max-width: 1010px; margin: 0 auto; padding: 40px 22px 60px; }

/* ---- Home ---- */
.hero { text-align: center; padding: 18px 0 4px; }
.hero-brand {
  display: flex; align-items: center; justify-content: center; gap: 18px;
  text-align: left;
}
.hero h1 {
  font-size: 32px; margin: 0; letter-spacing: -0.5px;
  text-transform: uppercase;
}
.hero-tagline { font-size: 15px; font-style: italic; color: var(--faded); margin: 2px 0 0; }
.hero-method-line { font-size: 16.5px; margin: 16px 0 0; }
.hero-method-line strong { font-family: Helvetica, Arial, sans-serif; }

.toc { list-style: none; padding: 0; margin: 20px 0 30px; }
.toc li + li { margin-top: 8px; }
.toc a {
  display: grid; grid-template-columns: 38px 1fr; grid-template-rows: auto auto;
  column-gap: 14px; align-items: baseline;
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  padding: 12px 20px; text-decoration: none; color: var(--ink);
  transition: border-color 0.15s, transform 0.15s;
}
.toc a:hover { border-color: var(--accent); transform: translateX(3px); }
.toc-num {
  grid-row: 1 / 3; font-size: 22px; font-weight: 700; color: var(--accent);
}
.toc-title { font-size: 17px; font-weight: 700; font-family: Helvetica, Arial, sans-serif; }
.toc-intro { font-size: 13.5px; font-style: italic; color: var(--faded); }
.toc a.toc-featured { border-left: 4px solid var(--accent); }

/* ---- "Play real songs now" callout ---- */
.songs-teaser {
  background: #fff; border: 1.5px solid var(--accent); border-radius: 10px;
  padding: 14px 20px; margin: 26px 0; font-size: 15.5px;
}
.songs-teaser a { color: var(--accent); font-weight: 700; }

/* ---- Root-note picker ---- */
.key-picker {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px;
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  padding: 12px 18px; margin: 0 0 22px;
  font-family: Helvetica, Arial, sans-serif; font-size: 15px;
}
.key-picker label { font-weight: 700; }
.key-picker select {
  font: inherit; font-weight: 700; color: var(--accent);
  padding: 6px 10px; border: 1.5px solid var(--accent); border-radius: 8px;
  background: #fff; cursor: pointer;
}
.key-hint { font-size: 13px; color: var(--faded); font-style: italic; }

/* ---- Level picker (song excerpts) ---- */
.level-picker {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px;
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  padding: 12px 18px; margin: 0 0 22px;
  font-family: Helvetica, Arial, sans-serif; font-size: 15px;
}
.level-label { font-weight: 700; }
.level-options { display: flex; flex-wrap: wrap; gap: 8px; }
.level-options label {
  border: 1.5px solid var(--line); border-radius: 999px;
  padding: 6px 14px; cursor: pointer; font-size: 14px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.level-options label:hover { border-color: var(--accent); }
.level-options label:has(input:checked) {
  border-color: var(--accent); background: var(--accent); color: #fff;
}
.level-options input { position: absolute; opacity: 0; pointer-events: none; }
.level-options em { font-style: italic; opacity: 0.75; font-size: 12.5px; }

.adapted-badge {
  display: inline-block; margin-bottom: 10px;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--accent); border: 1px solid var(--accent); border-radius: 999px;
  padding: 3px 10px;
}

/* ---- Song excerpt video ---- */
.video-cta { margin-top: 12px; }
.video-cta button.watch {
  font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700;
  color: var(--accent); background: #fff;
  border: 1.5px solid var(--accent); border-radius: 999px;
  padding: 8px 16px; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.video-cta button.watch:hover { background: var(--accent); color: #fff; }
.video-cta iframe {
  width: min(560px, 100%); aspect-ratio: 16 / 9;
  border: 0; border-radius: 10px; display: block;
}

/* ---- Chapters ---- */
.chapter-header { border-bottom: 3px solid var(--ink); padding-bottom: 12px; margin-bottom: 24px; }
.chapter-num {
  font-size: 12px; text-transform: uppercase; letter-spacing: 2px;
  color: var(--accent); font-weight: 700; margin-bottom: 4px;
}
.chapter h1 { font-size: 30px; margin: 0; }
.chapter-intro { font-size: 18px; font-style: italic; color: var(--faded); }
h3 { font-size: 21px; margin: 34px 0 10px; }
h4 { font-size: 16px; margin: 0 0 8px; }

/* ---- Diagrams ---- */
/* SVGs are generated at print size: scale them up here (vector, lossless).
   height:auto + viewBox preserve proportions. */
figure { margin: 26px 0; }
.diagram-cells {
  display: flex; flex-wrap: wrap; gap: 22px; align-items: flex-end;
}
.diagram-cell {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  padding: 14px 14px 12px;
}
.diagram-cell svg { width: 186px; height: auto; }
figcaption { font-size: 14px; color: var(--faded); font-style: italic; margin-top: 10px; }
.neck-map { position: relative; }
.neck-map-scroll { overflow-x: auto; background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
.neck-map-scroll svg { width: 100%; min-width: 720px; height: auto; }
.neck-map .play { position: static; margin: 0 0 8px; }
.legend { margin: 14px 0; }
.legend svg, .hero-legend svg { width: 390px; max-width: 100%; height: auto; }

/* ---- Audio playback ---- */
.play {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1.7px solid var(--accent); background: #fff; color: var(--accent);
  font-size: 14px; line-height: 1; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 0 0 2px;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}
.play:hover { background: var(--accent); color: #fff; }
.play:active { transform: scale(0.92); }
.play.playing { background: var(--accent); color: #fff; animation: pulse 0.9s ease-in-out infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 6px rgba(192, 57, 43, 0.15); } }

.note-dot { cursor: pointer; }
.note-dot:hover circle { filter: brightness(1.25); }
.note-dot.ringing circle { filter: brightness(1.45); }

/* ---- Boxes ---- */
.exercise {
  border: 1px solid var(--ink); border-left: 5px solid var(--accent);
  border-radius: 0 8px 8px 0;
  padding: 16px 22px; margin: 26px 0; background: #fff;
}
.exercise-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 2px;
  color: var(--accent); font-weight: 700; margin-bottom: 6px;
}
.exercise h4 { font-size: 18px; margin-bottom: 8px; }

.tip {
  background: #eef3f6; border-radius: 10px;
  padding: 14px 20px; margin: 26px 0; font-size: 15.5px;
}
.tip::before {
  content: 'Remember';
  display: block;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 11px; text-transform: uppercase; letter-spacing: 2px;
  color: var(--blue); font-weight: 700; margin-bottom: 6px;
}

table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 15px; }
th, td { border: 1px solid var(--line); padding: 7px 12px; text-align: left; background: #fff; }
th { font-family: Helvetica, Arial, sans-serif; font-size: 13px; background: #f1efeb; }

/* ---- Bottom pager ---- */
.pager {
  display: flex; justify-content: space-between; gap: 16px;
  margin-top: 50px; padding-top: 18px; border-top: 1px solid var(--line);
  font-family: Helvetica, Arial, sans-serif; font-size: 14.5px;
}
.pager a { color: var(--accent); text-decoration: none; font-weight: 700; }
.pager a:hover { text-decoration: underline; }

.site-footer {
  max-width: 1010px; margin: 0 auto; padding: 0 22px 40px;
  font-size: 13.5px; color: var(--faded); font-style: italic;
}

@media (max-width: 640px) {
  .brand { display: none; }
  main { padding: 24px 14px 40px; }
  .hero h1 { font-size: 30px; }
}
`;

/* ------------------------------------------------------------------ */
/*  Audio player — plucked-string synthesis (Karplus-Strong)           */
/* ------------------------------------------------------------------ */

const PLAYER_JS = /* js */ `
'use strict';

let ctx = null;
function audioCtx() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Plucked string via Karplus-Strong synthesis: a noise burst through a
 * filtered delay line. midi -> frequency, when in absolute seconds.
 */
function pluck(midi, when, { duration = 1.8, volume = 0.35 } = {}) {
  const ac = audioCtx();
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const sr = ac.sampleRate;
  const period = Math.round(sr / freq);
  const buffer = ac.createBuffer(1, Math.round(sr * duration), sr);
  const out = buffer.getChannelData(0);

  const delay = new Float32Array(period);
  for (let i = 0; i < period; i++) delay[i] = Math.random() * 2 - 1;

  // Damping: low notes ring longer, like on the instrument
  const damp = 0.994 + 0.004 * Math.min(1, freq / 660);
  for (let i = 0; i < out.length; i++) {
    const j = i % period;
    out[i] = delay[j];
    delay[j] = damp * 0.5 * (delay[j] + delay[(j + 1) % period]);
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  src.connect(gain).connect(ac.destination);
  src.start(when);
  return src;
}

/** Slow arpeggio (low -> high), then the strummed chord. Returns total duration. */
function playChord(midis) {
  const t0 = audioCtx().currentTime + 0.05;
  const step = 0.55;
  midis.forEach((m, i) => pluck(m, t0 + i * step));
  const strum = t0 + midis.length * step + 0.25;
  midis.forEach((m, i) => pluck(m, strum + i * 0.045, { volume: 0.3 }));
  return strum + 2.0 - t0;
}

/** The chord strummed directly, no arpeggio (song excerpts). */
function playStrum(midis) {
  const t0 = audioCtx().currentTime + 0.05;
  midis.forEach((m, i) => pluck(m, t0 + i * 0.045));
  return 2.1;
}

/** Sequence of voicings (neck maps): each chord strummed, one after another. */
function playSequence(seq) {
  const t0 = audioCtx().currentTime + 0.05;
  const step = 1.1;
  seq.forEach((midis, i) => {
    midis.forEach((m, j) => pluck(m, t0 + i * step + j * 0.05));
  });
  return seq.length * step + 1.2;
}

function markPlaying(button, seconds) {
  button.classList.add('playing');
  setTimeout(() => button.classList.remove('playing'), seconds * 1000);
}

document.addEventListener('click', event => {
  const dot = event.target.closest('.note-dot');
  if (dot) {
    pluck(Number(dot.dataset.midi), audioCtx().currentTime + 0.02);
    dot.classList.add('ringing');
    setTimeout(() => dot.classList.remove('ringing'), 400);
    return;
  }

  const button = event.target.closest('button.play');
  if (!button || button.classList.contains('playing')) return;
  if (button.dataset.notes) {
    const midis = button.dataset.notes.split(',').map(Number);
    markPlaying(button, 'strum' in button.dataset ? playStrum(midis) : playChord(midis));
  } else if (button.dataset.seq) {
    markPlaying(button, playSequence(JSON.parse(button.dataset.seq)));
  }
});
`;
