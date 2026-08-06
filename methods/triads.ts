import { noteName, parseNote } from '../src/theory/notes.js';
import { triad } from '../src/theory/triads.js';
import { StringSet } from '../src/fretboard/fretboard.js';
import { Block, Method } from '../src/render/html.js';
import {
  buildFigure,
  chordName,
  FigureSpec,
  INV_SHORT,
  KEY_MAJOR,
  nearestVoicing,
  RELATIVE_MINOR,
  SongChord,
} from '../src/figures.js';

/* ---------- Content helpers ---------- */

/** Reference key of the static rendering (PDF and site before selection). */
const DEFAULT_ROOT = parseNote('C');

/** Diagram row the site can recompute for the chosen root note. */
function keyedRow(spec: FigureSpec, extra: { title?: string; caption?: string } = {}): Block {
  return { kind: 'diagramRow', spec, diagrams: buildFigure(spec, DEFAULT_ROOT), ...extra };
}

/** Neck map the site can recompute for the chosen root note. */
function keyedMap(spec: FigureSpec, extra: { title?: string; caption?: string } = {}): Block {
  return {
    kind: 'neckMap',
    spec,
    voicings: buildFigure(spec, DEFAULT_ROOT).map(d => d.voicing),
    ...extra,
  };
}

/**
 * Fixed diagram row for real-song excerpts: exact voicings in the song's
 * key, deliberately NOT keyed to the root-note picker. The chord data is
 * embedded so the site's level control can re-voice the excerpt.
 */
function songRow(
  chords: SongChord[],
  extra: { title?: string; caption?: string; video?: { id: string; start: number; end: number } } = {},
): Block {
  const diagrams = chords.map(c => {
    const t = triad(c.root, c.quality);
    const v = nearestVoicing(t, c.set, c.nearFret ?? 0, [c.inversion]);
    return { voicing: v, title: `${chordName(t)} · ${INV_SHORT[c.inversion]}` };
  });
  return { kind: 'diagramRow', diagrams, strum: true, song: chords, ...extra };
}

/* ---------- Generated appendix: the 12 keys ---------- */

const CHROMATIC_ROOTS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

function allKeysTable(): string {
  const rows = CHROMATIC_ROOTS.map(r => {
    const root = parseNote(r);
    const maj = triad(root, 'major');
    const min = triad(root, 'minor');
    return `<tr>
      <td><strong>${noteName(root)}</strong></td>
      <td>${maj.notes.map(noteName).join(' – ')}</td>
      <td>${min.notes.map(noteName).join(' – ')}</td>
    </tr>`;
  }).join('\n');
  return `<table>
    <thead><tr><th>Root</th><th>Major triad (R · 3 · 5)</th><th>Minor triad (R · ♭3 · 5)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/* ---------- The method ---------- */

const SET_654: StringSet = [6, 5, 4];
const SET_123: StringSet = [3, 2, 1];

/** I – V – vi – IV, relative to the chosen root. */
const PROG_1564 = [
  KEY_MAJOR,
  { steps: 4, semis: 7, quality: 'major' as const },
  RELATIVE_MINOR,
  { steps: 3, semis: 5, quality: 'major' as const },
];

export const triadsMethod: Method = {
  title: 'Triads on the Guitar',
  subtitle: 'R · 3 · 5: root position and its inversions, all over the neck',
  volume: 'Volume 1 · Major & minor triads',
  chapters: [
    /* ---------------- Chapter 1 ---------------- */
    {
      title: 'What is a triad?',
      intro:
        'Before putting fingers on the neck, let’s take five minutes to understand what we are about to play.',
      blocks: [
        {
          kind: 'html',
          html: `<p>A <strong>triad</strong> is a three-note chord, built by stacking two thirds above
            a starting note called the <strong>root</strong> (written <strong>R</strong> in every
            diagram of this method). It is the basic building block of harmony: nearly every chord you
            know — open, barred, extended — has a triad at its core.</p>
          <p>From the same root, the quality of the stacked thirds produces four species:</p>
          <table>
            <thead><tr><th>Species</th><th>Formula</th><th>Example on C</th><th>Symbol</th></tr></thead>
            <tbody>
              <tr><td>Major</td><td>R · 3 · 5</td><td>C – E – G</td><td>C</td></tr>
              <tr><td>Minor</td><td>R · ♭3 · 5</td><td>C – E♭ – G</td><td>Cm</td></tr>
              <tr><td>Diminished</td><td>R · ♭3 · ♭5</td><td>C – E♭ – G♭</td><td>C°</td></tr>
              <tr><td>Augmented</td><td>R · 3 · ♯5</td><td>C – E – G♯</td><td>C+</td></tr>
            </tbody>
          </table>
          <p>This volume focuses on the two most common species: <strong>major</strong> and
            <strong>minor</strong>.</p>
          <h3>Root position and inversions</h3>
          <p>The three notes of a triad can be stacked in any order. Depending on which note sits at
            the bottom, we speak of:</p>
          <ul>
            <li><strong>root position</strong> — R at the bottom, the natural stack
              <strong>R · 3 · 5</strong>;</li>
            <li><strong>1st inversion</strong> — the third at the bottom (3 · 5 · R);</li>
            <li><strong>2nd inversion</strong> — the fifth at the bottom (5 · R · 3).</li>
          </ul>
          <p>That is also the study plan of this method: <strong>master root position on every string
            set first</strong>, starting from the low E string, then add the first inversion, then the
            second. By the end of the volume you will be able to play any triad in three places on
            each string set — in other words, everywhere.</p>`,
        },
        {
          kind: 'legend',
        },
        keyedRow(
          { kind: 'single', chord: KEY_MAJOR, set: SET_654, inversion: 0 },
          {
            title: 'First look: the major triad in root position, starting from the low E',
            caption:
              'R on the low E string (in C: fret 8), with the third and the fifth built above it: R · 3 · 5. The symbol in each dot is the degree; note names sit below the diagram.',
          },
        ),
        keyedRow(
          { kind: 'openChords', chords: [KEY_MAJOR] },
          {
            title: 'You already know it: the open chord',
            caption:
              'The “open” chord you have played since day one contains exactly these three notes — R, the third and the fifth, some of them simply doubled. A triad is not a new chord: it is the heart of the ones you already know. (This figure only appears in keys that have an open chord: C, D, E, G, A and their minors Dm, Em, Am.)',
          },
        ),
        {
          kind: 'tip',
          html: `<p>Every diagram in this method uses the same color code:
            <strong style="color:#c0392b">root (R) in red</strong>,
            <strong style="color:#2874a6">third in blue</strong>,
            <strong style="color:#839192">fifth in gray</strong>.
            Always find the root first: it is the note that names the chord.</p>`,
        },
      ],
    },

    /* ---------------- Chapter 2 ---------------- */
    {
      title: 'Root position (R · 3 · 5) on every string set',
      intro:
        'One single idea in this chapter: start from the root, under your finger, and build R · 3 · 5 above it — on all four string sets, from the low E upward.',
      blocks: [
        {
          kind: 'html',
          html: `<p>Root position is the most important of the three: it is the one that directly
            links the <em>name</em> of a chord to a <em>place</em> on the neck. Find your root on the
            low E string (a C: fret 8) and the triad builds itself above it. The same reasoning works
            on every group of three adjacent strings.</p>
          <p>Watch out when crossing string 2: the major third between strings 3 and 2 (the only one
            in standard tuning) shifts every note on strings 2 and 1 up by one fret. So the
            <em>shape</em> changes slightly from one string set to the next — but the
            <strong>R · 3 · 5</strong> order never does.</p>`,
        },
        keyedMap(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 0 },
          {
            title: 'The major triad in root position, on all four string sets',
            caption:
              'The same triad, four stories high, from strings 6-5-4 to strings 3-2-1. Find the red dot first: R is always the lowest note of the shape.',
          },
        ),
        keyedRow(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 0 },
          { title: 'The four shapes in detail, from low to high' },
        ),
        {
          kind: 'exercise',
          title: 'R · 3 · 5 on all four stories',
          html: `<ol>
            <li>Play the four shapes above in order, starting from strings 6-5-4. Before strumming,
              put your finger on the root first and name it.</li>
            <li>Play each shape <em>as an arpeggio</em>, low to high, naming the degrees:
              “root… third… fifth…”.</li>
            <li>With a metronome (60 BPM), one shape per bar, in a loop: 6-5-4 → 5-4-3 → 4-3-2 →
              3-2-1, then back down.</li>
          </ol>`,
        },
        keyedRow(
          { kind: 'acrossSets', chord: RELATIVE_MINOR, inversion: 0 },
          {
            title: 'The minor version, on all four string sets',
            caption:
              'Same logic, lowered third: R · ♭3 · 5. The diagrams show the relative minor of the chosen key (Am when working in C).',
          },
        ),
        keyedRow(
          { kind: 'openChords', chords: [KEY_MAJOR, RELATIVE_MINOR] },
          {
            title: 'The link with open chords',
            caption:
              'When the key allows it, the open chord exists: find R, 3 and 5 in it, in the same color code. Every string doubles one of the triad’s three notes — nothing more.',
          },
        ),
        {
          kind: 'exercise',
          title: 'Major ↔ minor in root position',
          html: `<ol>
            <li>On each string set, play the major triad then its minor version: only the third
              (blue dot) moves back one fret. Name the note that moves (in C: E → E♭).</li>
            <li>Do the same from the minor triad: Am → A → Am.</li>
            <li>Pick another root on the low E string (G, fret 3; A, fret 5; B♭, fret 6…) and
              rebuild R · 3 · 5 on all four string sets.</li>
          </ol>`,
        },
        {
          kind: 'tip',
          html: `<p><strong>“Minor = the third moves back one fret.”</strong> This reflex works on
            every string set, every inversion and every key. Remember the move, not just the
            shapes.</p>`,
        },
        {
          kind: 'html',
          html: `<div class="songs-teaser">🎸 <strong>You can already play real music.</strong>
            The final chapter, <a href="chapter-6.html">Triads in the wild</a>, adapts to your
            level: set it to <em>Root position only</em> and five real riffs — Ghost, Ozzy
            Osbourne, Dire Straits, Bob Marley, Daft Punk — are within reach with nothing more
            than this chapter.</div>`,
        },
      ],
    },

    /* ---------------- Chapter 3 ---------------- */
    {
      title: 'The first inversion (3 · 5 · R)',
      intro:
        'Root position in place? Now flip it: the third moves to the bottom, the root rises to the top.',
      blocks: [
        {
          kind: 'html',
          html: `<p>In the <strong>first inversion</strong>, the stack becomes
            <strong>3 · 5 · R</strong>: third at the bottom, root at the top. The red dot moves to
            another story — but it is still the note that names the chord. Learn to spot it
            <em>at the top</em> of the shape.</p>
          <p>On the neck, the first inversion of a triad always sits <em>above</em> its root
            position (or below it, one octave down).</p>`,
        },
        keyedMap(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 1 },
          { title: 'The major triad in first inversion, on all four string sets' },
        ),
        keyedRow(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 1 },
          { title: 'The four shapes, from low to high' },
        ),
        keyedRow(
          { kind: 'acrossSets', chord: RELATIVE_MINOR, inversion: 1 },
          { title: 'The minor version in first inversion' },
        ),
        {
          kind: 'exercise',
          title: 'Root position, then first inversion',
          html: `<ol>
            <li>On strings 6-5-4: play the major triad in root position, then its first inversion
              higher up the neck. Arpeggiate each one, naming the degrees: “R 3 5”, then
              “3 5 R”.</li>
            <li>Repeat on the other three string sets, always in that order:
              root position → first inversion.</li>
            <li>Do the same with the minor version, then in another key of your choice.</li>
          </ol>`,
        },
        {
          kind: 'tip',
          html: `<p>To the ear, the first inversion sounds <em>lighter</em>, less conclusive than
            root position: the bass is not playing the note that names the chord. Arrangers use it
            to make the bass line <em>walk</em> smoothly.</p>`,
        },
        {
          kind: 'html',
          html: `<div class="songs-teaser">🎸 In <a href="chapter-6.html">Triads in the wild</a>,
            switch the level to <em>Root + 1st inversion</em>: most of the excerpts now match the
            records exactly — Ghost and Ozzy Osbourne never use anything else.</div>`,
        },
      ],
    },

    /* ---------------- Chapter 4 ---------------- */
    {
      title: 'The second inversion (5 · R · 3)',
      intro:
        'The last piece of the puzzle: the fifth at the bottom. After this chapter, every triad has three addresses on each string set.',
      blocks: [
        {
          kind: 'html',
          html: `<p>In the <strong>second inversion</strong>, the stack becomes
            <strong>5 · R · 3</strong>: fifth at the bottom, root in the middle. It is often the most
            compact shape of the three — and the one hiding at the top of the open chords you
            already know.</p>`,
        },
        keyedMap(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 2 },
          { title: 'The major triad in second inversion, on all four string sets' },
        ),
        keyedRow(
          { kind: 'acrossSets', chord: KEY_MAJOR, inversion: 2 },
          { title: 'The four shapes, from low to high' },
        ),
        keyedRow(
          { kind: 'acrossSets', chord: RELATIVE_MINOR, inversion: 2 },
          { title: 'The minor version in second inversion' },
        ),
        keyedRow(
          { kind: 'openChords', chords: [KEY_MAJOR] },
          {
            title: 'The second inversion hides in the open chord',
            caption:
              'Look at the top of the open chord: in C, strings 3-2-1 (G – C – E) form precisely the second inversion — fifth at the bottom, R in the middle, third on top. You have been playing it all along.',
          },
        ),
        {
          kind: 'exercise',
          title: 'The three stacks, in order',
          html: `<ol>
            <li>On each string set, play the major triad through its three successive stacks:
              <strong>R · 3 · 5</strong> → <strong>3 · 5 · R</strong> →
              <strong>5 · R · 3</strong>, arpeggiating and naming the degrees.</li>
            <li>For each shape, say out loud where the root sits: “at the bottom”,
              “at the top”, “in the middle”.</li>
            <li>Do the same with the minor version, then in two other keys.</li>
          </ol>`,
        },
        {
          kind: 'tip',
          html: `<p>A mnemonic: the root <em>steps down</em> one story with each inversion — bottom
            (root position), top (1st), middle (2nd). If you always know where R is, you will never
            get lost.</p>`,
        },
      ],
    },

    /* ---------------- Chapter 5 ---------------- */
    {
      title: 'Connecting: the inversions along the neck',
      intro:
        'You now know the three stacks on every string set. What remains is to connect them: that is where the whole neck opens up.',
      blocks: [
        {
          kind: 'html',
          html: `<p>On a single string set, the three inversions follow one another along the neck,
            always in the same cyclic order: root position → 1st → 2nd → root position (an octave
            higher). Each shape starts where the previous one ends: neighboring shapes share
            notes.</p>`,
        },
        keyedMap(
          { kind: 'alongNeck', chord: KEY_MAJOR, set: SET_654 },
          {
            title: 'The major triad along the neck, strings 6-5-4',
            caption:
              'The three inversions chained going up (in C: 2nd inversion frets 2-3, root position frets 5-8, 1st inversion frets 10-12).',
          },
        ),
        keyedRow(
          { kind: 'alongNeck', chord: KEY_MAJOR, set: SET_654 },
          { title: 'The three shapes in detail' },
        ),
        {
          kind: 'exercise',
          title: 'Climb the neck without leaving it',
          html: `<ol>
            <li>On strings 6-5-4, chain the three shapes going up, then coming down, naming each
              inversion out loud.</li>
            <li>Same work on strings 3-2-1.</li>
            <li>With a metronome (60 BPM), one shape per bar, without breaking the pulse.</li>
          </ol>`,
        },
        {
          kind: 'html',
          html: `<h3>Application: the I–V–vi–IV progression</h3>
          <p>Hundreds of songs run on four chords. In C major, the <strong>I–V–vi–IV</strong>
            progression gives <strong>C – G – Am – F</strong>. A beginner plays it with open chords
            and big jumps of the hand. You will instead pick, for each chord, the inversion
            <em>closest</em> to the previous one: that is <strong>voice leading</strong>.</p>`,
        },
        keyedRow(
          { kind: 'progression', chords: PROG_1564, set: SET_123, startFret: 3 },
          {
            title: 'I – V – vi – IV around a single position, strings 3-2-1',
            caption:
              'Four chords, one position: no shape strays more than one fret away. The common notes (dots in the same spot) do not move. In C: C – G – Am – F.',
          },
        ),
        {
          kind: 'exercise',
          title: 'The progression, every which way',
          html: `<ol>
            <li>Play the progression above, two beats per chord, with a metronome (60 then 80 BPM).</li>
            <li>Play the same progression on strings 6-5-4, starting from the I in root
              position.</li>
            <li>Transpose to another key (in G: G – D – Em – C, around fret 3).</li>
          </ol>`,
        },
        {
          kind: 'tip',
          html: `<p>The reflex to build: whenever the chord changes, ask yourself
            <strong>“which note is common?”</strong> and keep it under your finger. Voice leading is
            nothing but well-understood laziness.</p>`,
        },
        {
          kind: 'html',
          html: `<h3>Appendix · The twelve keys</h3>
          <p>Every major and minor triad, spelled out. Use this table to check your transpositions —
            then put it away: the neck should become your only reference.</p>
          ${allKeysTable()}`,
        },
      ],
    },

    /* ---------------- Chapter 6 ---------------- */
    {
      title: 'Triads in the wild',
      teaser: '🎸 Real songs · playable from chapter 2',
      intro:
        'Everything you have practiced is hiding in records you already know. Five excerpts, five styles — and in each one, watch the same two ideas at work: inversions, and fingers that barely move.',
      blocks: [
        {
          kind: 'html',
          html: `<p>For each excerpt below, don’t just learn the shapes — read them with the tools
            from this method. Ask: <em>which inversion is this?</em> (find the red R), and
            <em>why this inversion here?</em> The answer is almost always the same: it is the one
            that keeps common notes in place and moves the fewest fingers. These excerpts are shown
            in their original keys.</p>
          <h3>Ghost — “Ritual” (intro)</h3>
          <p>A metal riff that is pure triad work: chugged sixteenth notes on strings 4-3-2, high on
            the neck, with muted scratches between chords. The whole intro lives between frets 7
            and 12.</p>`,
        },
        songRow(
          [
            { root: 'D', quality: 'minor', set: [4, 3, 2], inversion: 0, nearFret: 10 },
            { root: 'B♭', quality: 'major', set: [4, 3, 2], inversion: 1, nearFret: 10 },
            { root: 'C', quality: 'major', set: [4, 3, 2], inversion: 0, nearFret: 8 },
            { root: 'G', quality: 'major', set: [4, 3, 2], inversion: 1, nearFret: 7 },
          ],
          {
            caption:
              'Why these inversions? Dm and B♭ share two notes, D and F — they stay put, and the only move is A rising one fret to B♭. B♭ is played in 1st inversion precisely to make that possible. Same trick on C → G: the G on string 2 (fret 8) holds still while the other two fingers slide down, because G major takes its 1st inversion. Root notes change; the hand barely does.',
            video: { id: '0PakoE1eBps', start: 0, end: 14 },
          },
        ),
        {
          kind: 'html',
          html: `<h3>Ozzy Osbourne — “Crazy Train” (pre-chorus)</h3>
          <p>Randy Rhoads under “I’ve listened to preachers…”: palm-muted open A string as a
            pedal, and triads on strings 4-3-2 answering between the chugs. The chords walk
            <em>down</em> the neck, from fret 7 to fret 2, while the bass note never changes.</p>`,
        },
        songRow(
          [
            { root: 'A', quality: 'major', set: [4, 3, 2], inversion: 0, nearFret: 5 },
            { root: 'E', quality: 'major', set: [4, 3, 2], inversion: 1, nearFret: 4 },
            { root: 'D', quality: 'major', set: [4, 3, 2], inversion: 1, nearFret: 2 },
            { root: 'A', quality: 'major', set: [4, 3, 2], inversion: 2, nearFret: 2 },
          ],
          {
            caption:
              'Inversions in service of a descending line: A → E keeps the E (string 2, fret 5) in place while the other two fingers step down. E → D is the same 1st-inversion shape slid down two frets. D → A keeps the A (string 3, fret 2) and resolves onto the 2nd inversion — the closest A-major shape to where the hand already is. Four chords, one direction, and the open-A pedal ties it all together.',
            video: { id: 'FVovq9TGBw0', start: 52, end: 70 },
          },
        ),
        {
          kind: 'html',
          html: `<h3>Dire Straits — “Sultans of Swing” (verse turnaround)</h3>
          <p>Knopfler answers the vocal with chord stabs on the top three strings: Dm, C, B♭, then
            A major to turn the progression around.</p>`,
        },
        songRow(
          [
            { root: 'D', quality: 'minor', set: [3, 2, 1], inversion: 0, nearFret: 5 },
            { root: 'C', quality: 'major', set: [3, 2, 1], inversion: 0, nearFret: 3 },
            { root: 'B♭', quality: 'major', set: [3, 2, 1], inversion: 0, nearFret: 1 },
            { root: 'A', quality: 'major', set: [3, 2, 1], inversion: 0 },
          ],
          {
            caption:
              'The opposite strategy from “Ritual”: all four chords in root position, the same R · 3 · 5 stack walked down the neck. No common tones held here — you hear the shape itself slide, which is exactly the effect. Two chapters ago you learned this shape once; Knopfler shows it is a chord vocabulary all by itself.',
            video: { id: 'h0ffIJ7ZO4U', start: 0, end: 20 },
          },
        ),
        {
          kind: 'html',
          html: `<h3>Bob Marley — “Three Little Birds” (skank)</h3>
          <p>The reggae skank: short up-stroke chops on the offbeats, top three strings only. A
            I–IV–V in A major (A, D, E) that never leaves frets 5-9.</p>`,
        },
        songRow(
          [
            { root: 'A', quality: 'major', set: [3, 2, 1], inversion: 1, nearFret: 5 },
            { root: 'D', quality: 'major', set: [3, 2, 1], inversion: 0, nearFret: 5 },
            { root: 'E', quality: 'major', set: [3, 2, 1], inversion: 0, nearFret: 7 },
          ],
          {
            caption:
              'A is played in 1st inversion — not by accident: it puts the chord at fret 5-6, right next to its neighbors. A → D keeps the A on the high E string (fret 5) in place. D → E is the same root-position shape moved up two frets. One position, three chords, zero jumps: that is why the skank sounds so effortless.',
            video: { id: 'HNBCVM4KbUM', start: 0, end: 20 },
          },
        ),
        {
          kind: 'html',
          html: `<h3>Daft Punk ft. Nile Rodgers — “Get Lucky” (rhythm guitar)</h3>
          <p>Bm – D – F♯m – E, chopped in sixteenths. Here is the progression voiced with the
            chapter-5 rule — each chord takes the inversion closest to the previous one:</p>`,
        },
        songRow(
          [
            { root: 'B', quality: 'minor', set: [3, 2, 1], inversion: 0, nearFret: 3 },
            { root: 'D', quality: 'major', set: [3, 2, 1], inversion: 2, nearFret: 2 },
            { root: 'F♯', quality: 'minor', set: [3, 2, 1], inversion: 1, nearFret: 2 },
            { root: 'E', quality: 'major', set: [3, 2, 1], inversion: 1, nearFret: 2 },
          ],
          {
            caption:
              'Follow the common notes: Bm → D keeps two notes out of three (D and F♯) — only the G-string finger moves. D → F♯m keeps A and F♯ and again moves a single finger by one fret. Four different root notes, and no change costs more than one finger. That economy — inversions chosen so the hand stays put — is the engine of funk rhythm guitar.',
            video: { id: '5NV6Rdv1a3I', start: 0, end: 15 },
          },
        ),
        {
          kind: 'exercise',
          title: 'Steal these, then hunt your own',
          html: `<ol>
            <li>Learn the four excerpts. For each chord, name the inversion out loud before playing
              it, and find which note(s) it shares with the next chord.</li>
            <li>Take the “Ritual” excerpt and play it with <em>all root positions</em> instead.
              Feel how much more your hand moves — then go back to the original inversions.</li>
            <li>Pick a song you already play with open chords. Find its triads on strings 3-2-1
              around one position, using the chapter-5 rule. You just made your own arrangement.</li>
          </ol>`,
        },
        {
          kind: 'tip',
          html: `<p>Where to look for more: funk and reggae rhythm parts (top three strings, nearly
            always), verse guitars that leave room for the voice, and any riff that sounds “small
            but precise”. When a part sounds like a keyboard stab, it is usually a triad — find the
            R and the rest falls under your fingers.</p>`,
        },
      ],
    },
  ],
};
