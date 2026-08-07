import { noteName } from '../theory/notes.js';
import { Degree, degreeLabel } from '../theory/triads.js';
import { Voicing } from '../fretboard/fretboard.js';

/** Colors per degree — readable on screen and in print. */
export const DEGREE_COLORS: Record<Degree, string> = {
  root: '#c0392b',
  third: '#2874a6',
  fifth: '#839192',
};

const INK = '#2c3e50';
const FAINT = '#d5d8dc';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dot(cx: number, cy: number, r: number, color: string, label: string, fontSize: number, midi?: number): string {
  const size = label.length > 1 ? fontSize - 1.5 : fontSize; // "♭3", "♯5"…
  const inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>` +
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" ` +
    `fill="#fff" font-size="${size}" font-weight="600">${esc(label)}</text>`;
  // data-midi makes the dot playable on the site (inert in the PDF)
  return midi === undefined ? inner : `<g class="note-dot" data-midi="${midi}">${inner}</g>`;
}

/**
 * Vertical chord diagram (4-5 fret window), string 6 on the left.
 * Dots colored by degree, note names below the grid.
 */
export function chordDiagramSVG(v: Voicing, { title = '' } = {}): string {
  const STRINGS = 6;
  const SX = 19;           // string spacing
  const SY = 26;           // fret height
  const TOP = title ? 44 : 24;
  const LEFT = 33;
  const usesOpen = v.notes.some(n => n.fret === 0);
  const baseFret = usesOpen || v.maxFret <= 4 ? 1 : v.minFret === 0 ? 1 : v.minFret;
  const nFrets = Math.max(4, v.maxFret - baseFret + 1);
  const gridW = (STRINGS - 1) * SX;
  const gridH = nFrets * SY;
  const width = LEFT + gridW + 16;
  const height = TOP + gridH + 34;

  const xOfString = (s: number) => LEFT + (STRINGS - s) * SX; // string 6 on the left
  const played = new Map(v.notes.map(n => [n.string, n]));

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Helvetica, Arial, sans-serif">`);

  if (title) {
    parts.push(`<text x="${LEFT + gridW / 2}" y="15" text-anchor="middle" fill="${INK}" font-size="11.5" font-weight="700">${esc(title)}</text>`);
  }

  // Nut if the window starts at fret 1
  if (baseFret === 1) {
    parts.push(`<rect x="${LEFT - 1}" y="${TOP - 4}" width="${gridW + 2}" height="4" fill="${INK}" rx="1"/>`);
  }

  // Fret numbers on every row — emphasized where fingers go
  const fretsUsed = new Set(v.notes.map(n => n.fret));
  for (let f = 0; f < nFrets; f++) {
    const fretNum = baseFret + f;
    const used = fretsUsed.has(fretNum);
    const y = TOP + (f + 0.5) * SY;
    parts.push(`<text x="${LEFT - 12}" y="${y}" text-anchor="end" dominant-baseline="central" ` +
      `fill="${used ? INK : FAINT}" font-size="${used ? 10.5 : 9}" font-weight="${used ? 700 : 400}">${fretNum}</text>`);
  }

  // Fret lines
  for (let f = 0; f <= nFrets; f++) {
    const y = TOP + f * SY;
    parts.push(`<line x1="${LEFT}" y1="${y}" x2="${LEFT + gridW}" y2="${y}" stroke="${INK}" stroke-width="1"/>`);
  }

  // Strings: played in ink, unplayed faded
  for (let s = 1; s <= STRINGS; s++) {
    const x = xOfString(s);
    const active = played.has(s);
    parts.push(`<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + gridH}" stroke="${active ? INK : FAINT}" stroke-width="${active ? 1.4 : 1}"/>`);
    if (!active) {
      parts.push(`<text x="${x}" y="${TOP - 8}" text-anchor="middle" fill="${FAINT}" font-size="10">✕</text>`);
    }
  }

  // Notes
  for (const n of v.notes) {
    const x = xOfString(n.string);
    const label = degreeLabel(v.triad.quality, n.degree);
    if (n.fret === 0) {
      parts.push(dot(x, TOP - 11, 7.5, DEGREE_COLORS[n.degree], label, 8.5, n.midi));
    } else {
      const y = TOP + (n.fret - baseFret + 0.5) * SY;
      parts.push(dot(x, y, 9, DEGREE_COLORS[n.degree], label, 9.5, n.midi));
    }
    parts.push(`<text x="${x}" y="${TOP + gridH + 16}" text-anchor="middle" fill="${INK}" font-size="10.5">${esc(noteName(n.note))}</text>`);
  }

  parts.push('</svg>');
  return parts.join('');
}

/**
 * Horizontal neck map (nut on the left, string 1 on top) showing several
 * voicings at once — typically the three inversions of a triad along
 * the neck.
 */
export function neckMapSVG(voicings: Voicing[], { maxFret = 15 } = {}): string {
  // Some keys push a voicing past fret 15: extend the map
  const highest = Math.max(0, ...voicings.flatMap(v => v.notes.map(n => n.fret)));
  maxFret = Math.max(maxFret, highest);
  const SY = 17;           // string spacing
  const FX = 42;           // fret width
  const LEFT = 34;         // room for open-string notes
  const TOP = 12;
  const gridH = 5 * SY;
  const gridW = maxFret * FX;
  const width = LEFT + gridW + 14;
  const height = TOP + gridH + 30;

  const yOfString = (s: number) => TOP + (s - 1) * SY;
  const xOfFret = (f: number) => (f === 0 ? LEFT - 14 : LEFT + (f - 0.5) * FX);

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Helvetica, Arial, sans-serif">`);

  // Traditional inlay markers (frets 3, 5, 7, 9, 12, 15)
  for (const f of [3, 5, 7, 9, 12, 15]) {
    if (f > maxFret) continue;
    const x = LEFT + (f - 0.5) * FX;
    if (f === 12) {
      parts.push(`<circle cx="${x}" cy="${TOP + 1.5 * SY}" r="4" fill="#eceff1"/>`);
      parts.push(`<circle cx="${x}" cy="${TOP + 3.5 * SY}" r="4" fill="#eceff1"/>`);
    } else {
      parts.push(`<circle cx="${x}" cy="${TOP + gridH / 2}" r="4" fill="#eceff1"/>`);
    }
    parts.push(`<text x="${x}" y="${TOP + gridH + 16}" text-anchor="middle" fill="#90a4ae" font-size="10">${f}</text>`);
  }

  // Nut
  parts.push(`<rect x="${LEFT - 3}" y="${TOP - 1}" width="3.5" height="${gridH + 2}" fill="${INK}"/>`);

  // Fret lines
  for (let f = 1; f <= maxFret; f++) {
    const x = LEFT + f * FX;
    parts.push(`<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + gridH}" stroke="#b0bec5" stroke-width="1"/>`);
  }

  // Strings (string 1 on top, growing thickness toward the bass)
  for (let s = 1; s <= 6; s++) {
    const y = yOfString(s);
    parts.push(`<line x1="${LEFT}" y1="${y}" x2="${LEFT + gridW}" y2="${y}" stroke="${INK}" stroke-width="${0.7 + s * 0.18}"/>`);
  }

  // Notes of all voicings
  for (const v of voicings) {
    for (const n of v.notes) {
      const label = degreeLabel(v.triad.quality, n.degree);
      parts.push(dot(xOfFret(n.fret), yOfString(n.string), 7.5, DEGREE_COLORS[n.degree], label, 8.5, n.midi));
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

/**
 * The circle of fifths: majors on the outer ring, relative minors inside.
 * Clockwise = fifths (the workout's direction), counterclockwise = fourths.
 */
export function circleOfFifthsSVG(): string {
  const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  const MINORS = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
  const C = 170;             // centre (viewBox 340×340)
  const R_MAJOR = 122;
  const R_MINOR = 80;
  const pos = (i: number, r: number) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340" font-family="Helvetica, Arial, sans-serif">`);
  parts.push(`<defs><marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L8 4 L0 8 Z" fill="${DEGREE_COLORS.root}"/></marker></defs>`);

  // Direction arrow: clockwise over the top, from F toward G
  parts.push(`<path d="M ${pos(11.45, R_MAJOR + 26)[0]} ${pos(11.45, R_MAJOR + 26)[1]} A ${R_MAJOR + 26} ${R_MAJOR + 26} 0 0 1 ${pos(0.55, R_MAJOR + 26)[0]} ${pos(0.55, R_MAJOR + 26)[1]}"
    fill="none" stroke="${DEGREE_COLORS.root}" stroke-width="1.6" marker-end="url(#arrow)"/>`);

  // Rings
  parts.push(`<circle cx="${C}" cy="${C}" r="${R_MAJOR}" fill="none" stroke="${FAINT}" stroke-width="1"/>`);
  parts.push(`<circle cx="${C}" cy="${C}" r="${R_MINOR}" fill="none" stroke="${FAINT}" stroke-width="1" stroke-dasharray="3 4"/>`);

  for (let i = 0; i < 12; i++) {
    const [x, y] = pos(i, R_MAJOR);
    const start = i === 0; // C, where the workout begins
    parts.push(`<circle cx="${x}" cy="${y}" r="17" fill="${start ? DEGREE_COLORS.root : '#fff'}" stroke="${start ? DEGREE_COLORS.root : INK}" stroke-width="1.3"/>`);
    parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${start ? '#fff' : INK}" font-size="13" font-weight="700">${esc(MAJORS[i])}</text>`);
    const [mx, my] = pos(i, R_MINOR);
    parts.push(`<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" fill="#90a4ae" font-size="10.5">${esc(MINORS[i])}</text>`);
  }

  // Direction labels
  parts.push(`<text x="${C}" y="16" text-anchor="middle" fill="${DEGREE_COLORS.root}" font-size="11" font-weight="700">fifths →</text>`);
  parts.push(`<text x="${C}" y="${C - R_MINOR + 34}" text-anchor="middle" fill="#90a4ae" font-size="10.5">← fourths</text>`);

  parts.push('</svg>');
  return parts.join('');
}

/** Degree color legend, to place once per page or chapter. */
export function degreeLegendSVG(labels: Partial<Record<Degree, string>> = {}): string {
  const items: [Degree, string][] = [
    ['root', labels.root ?? 'Root'],
    ['third', labels.third ?? 'Third'],
    ['fifth', labels.fifth ?? 'Fifth'],
  ];
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="24" viewBox="0 0 330 24" font-family="Helvetica, Arial, sans-serif">`];
  let x = 8;
  for (const [degree, label] of items) {
    parts.push(`<circle cx="${x}" cy="12" r="7" fill="${DEGREE_COLORS[degree]}"/>`);
    parts.push(`<text x="${x + 12}" y="12" dominant-baseline="central" fill="${INK}" font-size="11.5">${esc(label)}</text>`);
    x += 115;
  }
  parts.push('</svg>');
  return parts.join('');
}
