import { Note, noteAbove, parseNote } from './notes.js';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export type Degree = 'root' | 'third' | 'fifth';

/** Semitones of the third and the fifth above the root. */
const QUALITY_SEMITONES: Record<TriadQuality, [number, number]> = {
  major: [4, 7],
  minor: [3, 7],
  diminished: [3, 6],
  augmented: [4, 8],
};

/** Chord-symbol suffix: C, Cm, C°, C+ */
export const QUALITY_SUFFIX: Record<TriadQuality, string> = {
  major: '', minor: 'm', diminished: '°', augmented: '+',
};

export interface Triad {
  root: Note;
  quality: TriadQuality;
  /** Spelled notes: [root, third, fifth] */
  notes: [Note, Note, Note];
}

export function triad(root: Note | string, quality: TriadQuality): Triad {
  const r = typeof root === 'string' ? parseNote(root) : root;
  const [third, fifth] = QUALITY_SEMITONES[quality];
  return {
    root: r,
    quality,
    notes: [r, noteAbove(r, 2, third), noteAbove(r, 4, fifth)],
  };
}

export const DEGREES: Degree[] = ['root', 'third', 'fifth'];

/** Degree label shown in diagrams: R, 3 / ♭3, 5 / ♭5 / ♯5 */
export function degreeLabel(quality: TriadQuality, degree: Degree): string {
  if (degree === 'root') return 'R';
  if (degree === 'third') return quality === 'minor' || quality === 'diminished' ? '♭3' : '3';
  if (quality === 'diminished') return '♭5';
  if (quality === 'augmented') return '♯5';
  return '5';
}
