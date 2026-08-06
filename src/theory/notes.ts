/**
 * Music domain: spelled notes (letter + accidental), pitch classes.
 * Zero dependencies — everything else in the project builds on this module.
 */

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const LETTER_PITCH_CLASS: Record<Letter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** A spelled note: F♯ and G♭ are distinct even though they sound the same. */
export interface Note {
  letter: Letter;
  /** -1 = flat, 0 = natural, +1 = sharp (…-2/+2 for doubles) */
  alter: number;
}

/** Pitch class (0–11, C = 0). */
export function pitchClass(note: Note): number {
  return ((LETTER_PITCH_CLASS[note.letter] + note.alter) % 12 + 12) % 12;
}

/** Parses "C", "F#", "Bb", "E♭", "C♯"… */
export function parseNote(input: string): Note {
  const match = input.trim().match(/^([A-Ga-g])([#♯b♭]*)$/);
  if (!match) throw new Error(`Invalid note: "${input}"`);
  const letter = match[1].toUpperCase() as Letter;
  let alter = 0;
  for (const c of match[2]) alter += c === '#' || c === '♯' ? 1 : -1;
  return { letter, alter };
}

const ALTER_SYMBOLS: Record<number, string> = {
  [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪',
};

export function noteName(note: Note): string {
  return note.letter + (ALTER_SYMBOLS[note.alter] ?? '?');
}

/**
 * The note `letterSteps` letter-degrees above `root`, altered so it sounds
 * `semitones` semitones above it. This is what guarantees correct spelling
 * (the third of E♭ is G, not F𝄪).
 */
export function noteAbove(root: Note, letterSteps: number, semitones: number): Note {
  const letterIndex = LETTERS.indexOf(root.letter);
  const letter = LETTERS[(letterIndex + letterSteps) % 7];
  const targetPc = (pitchClass(root) + semitones) % 12;
  const naturalPc = LETTER_PITCH_CLASS[letter];
  // Accidental in [-2, +2], closest to the target pitch class
  let alter = targetPc - naturalPc;
  if (alter > 6) alter -= 12;
  if (alter < -6) alter += 12;
  return { letter, alter };
}
