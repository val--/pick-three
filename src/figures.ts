/**
 * Key-aware figures: a FigureSpec describes what a diagram shows (relative
 * to the chosen root note), and buildFigure turns it into concrete voicings.
 * Used by the generator (default rendering in C) AND by the browser
 * (recomputed when the user picks another root).
 */
import { Note, noteAbove, noteName, pitchClass } from './theory/notes.js';
import { DEGREES, triad, Triad, TriadQuality, QUALITY_SUFFIX } from './theory/triads.js';
import {
  FrettedNote,
  inversionsAlongNeck,
  STANDARD_TUNING,
  StringSet,
  stringSetLabel,
  Voicing,
  voicingsForInversion,
} from './fretboard/fretboard.js';

export const INV_SHORT = ['root position', '1st inversion', '2nd inversion'] as const;

/** String sets from low to high — we start from the low E string. */
export const ALL_SETS: StringSet[] = [
  [6, 5, 4],
  [5, 4, 3],
  [4, 3, 2],
  [3, 2, 1],
];

/**
 * A chord defined relative to the chosen root: `steps` letter-degrees and
 * `semis` semitones above it (correct spelling guaranteed).
 */
export interface ChordRef {
  steps: number;
  semis: number;
  quality: TriadQuality;
}

export const KEY_MAJOR: ChordRef = { steps: 0, semis: 0, quality: 'major' };
export const KEY_MINOR: ChordRef = { steps: 0, semis: 0, quality: 'minor' };
/** The vi degree: the relative minor (Am when the root is C). */
export const RELATIVE_MINOR: ChordRef = { steps: 5, semis: 9, quality: 'minor' };

export type FigureSpec =
  | { kind: 'single'; chord: ChordRef; set: StringSet; inversion: 0 | 1 | 2 }
  | { kind: 'acrossSets'; chord: ChordRef; inversion: 0 | 1 | 2 }
  | { kind: 'alongNeck'; chord: ChordRef; set: StringSet; fromFret?: number }
  | { kind: 'progression'; chords: ChordRef[]; set: StringSet; startFret: number; allowed?: readonly (0 | 1 | 2)[] }
  | { kind: 'openChords'; chords: ChordRef[] };

export interface FigureDiagram {
  voicing: Voicing;
  title: string;
}

export function chordName(t: Triad): string {
  return noteName(t.root) + QUALITY_SUFFIX[t.quality];
}

/** Chord names for a progression in a given key — e.g. ["Bm", "A", "D", "G"]. */
export function progressionChordNames(chords: ChordRef[], root: Note): string[] {
  return chords.map(cr => chordName(chordOf(root, cr)));
}

/**
 * Up to 3 well-spread voicings of a progression in a given key: the chain
 * (chapter-5 nearest-voicing rule) anchored at increasing neck positions,
 * keeping only the ones whose average fret differs enough from every
 * position already kept. Some progressions only have room for 2.
 */
export function progressionPositions(
  chords: ChordRef[],
  set: StringSet,
  root: Note,
  allowed: readonly (0 | 1 | 2)[] = [0, 1, 2],
): FigureDiagram[][] {
  const center = (diagrams: FigureDiagram[]) =>
    diagrams.reduce((sum, d) => sum + d.voicing.minFret, 0) / diagrams.length;
  const MIN_GAP = 2.5;

  const accepted: FigureDiagram[][] = [];
  const centers: number[] = [];
  for (let anchor = 0; anchor <= 15 && accepted.length < 3; anchor++) {
    const diagrams = buildFigure({ kind: 'progression', chords, set, startFret: anchor, allowed }, root);
    const c = center(diagrams);
    if (centers.some(prev => Math.abs(prev - c) < MIN_GAP)) continue;
    centers.push(c);
    accepted.push(diagrams);
  }
  return accepted;
}

/**
 * The progression at the nut: the chapter-5 chain anchored at fret 0 with
 * every inversion allowed, whatever level the reader has selected. A
 * root-position-only chain is often forced up the neck — G on strings 3-2-1
 * has no close root-position voicing below fret 12, since the open-string
 * one spans 10 frets — and this is the escape hatch for that.
 */
export function nearNutPosition(
  chords: ChordRef[],
  set: StringSet,
  root: Note,
): FigureDiagram[] {
  return buildFigure({ kind: 'progression', chords, set, startFret: 0, allowed: [0, 1, 2] }, root);
}

/** A progression diagram that had to fall back to a triad for want of an open shape. */
export interface OpenChordDiagram extends FigureDiagram {
  /** No standard open shape exists for this chord — `voicing` is its lowest triad instead. */
  fallback: boolean;
}

/**
 * The progression played with standard open chords. Only 8 shapes exist
 * (C D E G A, Dm Em Am), so most keys leave gaps: F in C, Bm in D, B and
 * C#m in E. Those chords fall back to their lowest triad on `set` and are
 * flagged, rather than dropping out of the row and breaking the count.
 */
export function openChordProgression(
  chords: ChordRef[],
  set: StringSet,
  root: Note,
): OpenChordDiagram[] {
  return chords.map(cr => {
    const t = chordOf(root, cr);
    const open = openChordVoicing(t);
    if (open) return { voicing: open, title: `${chordName(t)} \u00b7 open chord`, fallback: false };
    const v = nearestVoicing(t, set, 0, [0, 1, 2]);
    return { voicing: v, title: `${chordName(t)} \u00b7 ${INV_SHORT[v.inversion]}`, fallback: true };
  });
}

/** Label for the Nth of `total` voicings of a progression (1-3, low to high on the neck). */
export function positionLabel(i: number, total: number): string {
  if (total <= 1) return 'Voicing';
  if (total === 2) return i === 0 ? 'Lower position' : 'Higher position';
  return ['Lower position', 'Mid position', 'Higher position'][i];
}

function diagramTitle(v: Voicing): string {
  return `${chordName(v.triad)} · ${INV_SHORT[v.inversion]}`;
}

function chordOf(root: Note, ref: ChordRef): Triad {
  return triad(noteAbove(root, ref.steps, ref.semis), ref.quality);
}

/**
 * The voicing closest to a reference fret — used for voice leading.
 * `allowed` restricts the inversions considered (learner level).
 */
export function nearestVoicing(
  t: Triad,
  set: StringSet,
  refFret: number,
  allowed: readonly (0 | 1 | 2)[] = [0, 1, 2],
): Voicing {
  const all = allowed.flatMap(inv => voicingsForInversion(t, set, inv));
  return all.sort(
    (a, b) => Math.abs(a.minFret - refFret) - Math.abs(b.minFret - refFret),
  )[0];
}

/** One song voicing: a specific triad, at a specific spot on the neck. */
export interface SongChord {
  root: string;
  quality: TriadQuality;
  set: StringSet;
  inversion: 0 | 1 | 2;
  /** Picks the occurrence closest to this fret (default: the lowest one). */
  nearFret?: number;
}

/**
 * A circle drill: roots in circle order, string sets rotating through the
 * allowed pool. Powers the workout's configurable in-position row.
 */
export interface CircleSpec {
  roots: string[];
  quality: TriadQuality;
  /** Fret area where the first chord anchors. */
  anchor: number;
}

export function circleChords(spec: CircleSpec, sets: StringSet[]): SongChord[] {
  return spec.roots.map((root, i) => ({
    root,
    quality: spec.quality,
    set: sets[i % sets.length],
    inversion: 0,
    nearFret: i === 0 ? spec.anchor : undefined,
  }));
}

/**
 * A song excerpt re-voiced within the allowed inversions: each chord takes
 * the nearest allowed voicing (the chapter-5 rule), anchored on the first
 * chord's original position. Powers the "adapt to your level" control.
 */
export function songDiagrams(chords: SongChord[], allowed: readonly (0 | 1 | 2)[]): FigureDiagram[] {
  let ref: number | undefined;
  return chords.map(c => {
    const t = triad(c.root, c.quality);
    const v = nearestVoicing(t, c.set, ref ?? c.nearFret ?? 0, allowed);
    ref = v.minFret;
    return { voicing: v, title: `${chordName(t)} · ${INV_SHORT[v.inversion]}` };
  });
}

/**
 * Standard open chords: frets per string, from string 6 to 1 (-1 = muted).
 * Triads keep their degrees here — an open chord is just the triad with
 * doubled notes.
 */
const OPEN_SHAPES: { quality: TriadQuality; rootPc: number; frets: number[] }[] = [
  { quality: 'major', rootPc: 0, frets: [-1, 3, 2, 0, 1, 0] },   // C
  { quality: 'major', rootPc: 2, frets: [-1, -1, 0, 2, 3, 2] },  // D
  { quality: 'major', rootPc: 4, frets: [0, 2, 2, 1, 0, 0] },    // E
  { quality: 'major', rootPc: 7, frets: [3, 2, 0, 0, 0, 3] },    // G
  { quality: 'major', rootPc: 9, frets: [-1, 0, 2, 2, 2, 0] },   // A
  { quality: 'minor', rootPc: 2, frets: [-1, -1, 0, 2, 3, 1] },  // Dm
  { quality: 'minor', rootPc: 4, frets: [0, 2, 2, 0, 0, 0] },    // Em
  { quality: 'minor', rootPc: 9, frets: [-1, 0, 2, 2, 1, 0] },   // Am
];

/** This triad's standard open chord, if one exists. */
export function openChordVoicing(t: Triad): Voicing | null {
  const shape = OPEN_SHAPES.find(
    s => s.quality === t.quality && s.rootPc === pitchClass(t.root),
  );
  if (!shape) return null;

  const notes: FrettedNote[] = [];
  shape.frets.forEach((fret, i) => {
    if (fret < 0) return;
    const string = 6 - i;
    const midi = STANDARD_TUNING.midi[string] + fret;
    const idx = t.notes.findIndex(n => pitchClass(n) === midi % 12);
    notes.push({ string, fret, midi, note: t.notes[idx], degree: DEGREES[idx] });
  });
  const frets = notes.map(n => n.fret);
  const inversion = DEGREES.indexOf(notes[0].degree) as 0 | 1 | 2;
  return {
    triad: t,
    stringSet: [6, 5, 4], // not meaningful for a full chord
    inversion,
    notes,
    minFret: Math.min(...frets),
    maxFret: Math.max(...frets),
  };
}

export function buildFigure(spec: FigureSpec, root: Note): FigureDiagram[] {
  switch (spec.kind) {
    case 'single': {
      const t = chordOf(root, spec.chord);
      const v = voicingsForInversion(t, spec.set, spec.inversion)[0];
      return v ? [{ voicing: v, title: `${chordName(t)} · ${stringSetLabel(spec.set)}` }] : [];
    }
    case 'acrossSets': {
      const t = chordOf(root, spec.chord);
      return ALL_SETS.flatMap(set => {
        const v = voicingsForInversion(t, set, spec.inversion)[0];
        return v ? [{ voicing: v, title: `${chordName(t)} · ${stringSetLabel(set)}` }] : [];
      });
    }
    case 'alongNeck': {
      const t = chordOf(root, spec.chord);
      return inversionsAlongNeck(t, spec.set, { fromFret: spec.fromFret ?? 0 })
        .map(v => ({ voicing: v, title: diagramTitle(v) }));
    }
    case 'progression': {
      let ref = spec.startFret;
      const allowed = spec.allowed ?? [0, 1, 2];
      return spec.chords.map(cr => {
        const v = nearestVoicing(chordOf(root, cr), spec.set, ref, allowed);
        ref = v.minFret;
        return { voicing: v, title: diagramTitle(v) };
      });
    }
    case 'openChords': {
      return spec.chords.flatMap(cr => {
        const t = chordOf(root, cr);
        const v = openChordVoicing(t);
        return v ? [{ voicing: v, title: `${chordName(t)} · open chord` }] : [];
      });
    }
  }
}
