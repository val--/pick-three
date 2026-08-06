import { Note, pitchClass } from '../theory/notes.js';
import { Degree, DEGREES, Triad } from '../theory/triads.js';

/**
 * Tuning: MIDI pitch of each open string, indexed by string number
 * (1 = high E … 6 = low E).
 */
export interface Tuning {
  name: string;
  /** midi[string] — index 0 is unused. */
  midi: number[];
}

export const STANDARD_TUNING: Tuning = {
  name: 'Standard tuning (E A D G B E)',
  midi: [NaN, 64, 59, 55, 50, 45, 40],
};

/** Group of 3 adjacent strings, lowest-pitched to highest. */
export type StringSet = [number, number, number];

export const STRING_SETS: StringSet[] = [
  [3, 2, 1],
  [4, 3, 2],
  [5, 4, 3],
  [6, 5, 4],
];

export function stringSetLabel(set: StringSet): string {
  return `strings ${[...set].join('-')}`;
}

export interface FrettedNote {
  string: number;
  fret: number;
  midi: number;
  note: Note;
  degree: Degree;
}

/** Inversion: 0 = root position, 1 = first inversion, 2 = second. */
export interface Voicing {
  triad: Triad;
  stringSet: StringSet;
  inversion: 0 | 1 | 2;
  notes: FrettedNote[];
  minFret: number;
  maxFret: number;
}

export const INVERSION_LABELS = [
  'root position',
  '1st inversion',
  '2nd inversion',
] as const;

/**
 * All close-voiced positions of a given inversion on a string set: the
 * bottom note determines the inversion, each following string carries the
 * next chord tone above it.
 */
export function voicingsForInversion(
  t: Triad,
  stringSet: StringSet,
  inversion: 0 | 1 | 2,
  { tuning = STANDARD_TUNING, maxFret = 15 } = {},
): Voicing[] {
  // Degree order from low to high for this inversion
  const order: Degree[] = [
    DEGREES[inversion],
    DEGREES[(inversion + 1) % 3],
    DEGREES[(inversion + 2) % 3],
  ];
  const noteOf = (d: Degree) => t.notes[DEGREES.indexOf(d)];

  const results: Voicing[] = [];
  const [lowString, ...upperStrings] = stringSet;

  for (let f0 = 0; f0 <= maxFret; f0++) {
    const bottomMidi = tuning.midi[lowString] + f0;
    if (pitchClass(noteOf(order[0])) !== bottomMidi % 12) continue;

    const notes: FrettedNote[] = [
      { string: lowString, fret: f0, midi: bottomMidi, note: noteOf(order[0]), degree: order[0] },
    ];
    let prevMidi = bottomMidi;
    for (let i = 0; i < upperStrings.length; i++) {
      const s = upperStrings[i];
      const target = noteOf(order[i + 1]);
      // Smallest fret sounding the right note above the previous one
      let fret = (pitchClass(target) - tuning.midi[s] % 12 + 24) % 12;
      while (tuning.midi[s] + fret <= prevMidi) fret += 12;
      prevMidi = tuning.midi[s] + fret;
      notes.push({ string: s, fret, midi: prevMidi, note: target, degree: order[i + 1] });
    }

    const frets = notes.map(n => n.fret);
    const minFret = Math.min(...frets);
    const maxUsed = Math.max(...frets);
    if (maxUsed > maxFret) continue;
    if (maxUsed - minFret > 4) continue; // unplayable as a close voicing

    results.push({ triad: t, stringSet, inversion, notes, minFret, maxFret: maxUsed });
  }
  return results;
}

/**
 * The three inversions of a triad on a string set, each at its first
 * occurrence from `fromFret` up — the natural "along the neck" sequence
 * used throughout the method.
 */
export function inversionsAlongNeck(
  t: Triad,
  stringSet: StringSet,
  { fromFret = 0, maxFret = 15 } = {},
): Voicing[] {
  const all = ([0, 1, 2] as const)
    .flatMap(inv => voicingsForInversion(t, stringSet, inv, { maxFret }))
    .filter(v => v.minFret >= fromFret)
    .sort((a, b) => a.minFret - b.minFret);
  const seen = new Set<number>();
  const picked: Voicing[] = [];
  for (const v of all) {
    if (seen.has(v.inversion)) continue;
    seen.add(v.inversion);
    picked.push(v);
  }
  return picked;
}
