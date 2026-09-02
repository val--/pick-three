import { Block, Chapter, ProgressionDef } from '../src/render/html.js';
import { ChordRef, KEY_MAJOR, KEY_MINOR, RELATIVE_MINOR } from '../src/figures.js';

/* ---------- Scale degrees, relative to whatever root is chosen ---------- */
/* Uppercase = major triad, lowercase = minor triad — same convention as    */
/* the numerals printed on the page. A "b" prefix (bIII, bVI, bVII) means   */
/* the chord's root sits a semitone below where the major scale would put  */
/* it — the usual borrowing in minor-key progressions.                     */

const I = KEY_MAJOR;
const ii: ChordRef = { steps: 1, semis: 2, quality: 'minor' };
const IV: ChordRef = { steps: 3, semis: 5, quality: 'major' };
const V: ChordRef = { steps: 4, semis: 7, quality: 'major' };
const vi = RELATIVE_MINOR;

const i = KEY_MINOR;
const bIII: ChordRef = { steps: 2, semis: 3, quality: 'major' };
const bVI: ChordRef = { steps: 5, semis: 8, quality: 'major' };
const bVII: ChordRef = { steps: 6, semis: 10, quality: 'major' };

const PROGRESSIONS: ProgressionDef[] = [
  {
    id: 'I-V-vi-IV',
    label: 'I – V – vi – IV',
    chords: [I, V, vi, IV],
    defaultRoot: 'C',
    blurb: `<h3>I – V – vi – IV — the four-chord loop</h3>
      <p>Possibly the most recorded progression in pop and rock: four chords, looped, in every
      genre from doo-wop to arena anthems. Play it a beat or two per chord and you already
      recognize a hundred choruses.</p>
      <p class="known-from">Recognizable from: “Let It Be” – The Beatles, “With or Without You” –
      U2, “Don’t Stop Believin’” – Journey.</p>`,
    keySongs: {
      C: '“Let It Be” – The Beatles',
      D: '“With or Without You” – U2',
      E: '“Don’t Stop Believin’” – Journey',
    },
  },
  {
    id: 'vi-IV-I-V',
    label: 'vi – IV – I – V',
    chords: [vi, IV, I, V],
    defaultRoot: 'C',
    blurb: `<h3>vi – IV – I – V — the same four chords, started elsewhere</h3>
      <p>Identical chords to the loop above, but entering on the relative minor first: the loop
      feels like it opens on a question rather than an answer. A single set of four triads,
      two very different moods depending on where you start counting.</p>
      <p class="known-from">Recognizable from: “Zombie” – The Cranberries, “Save Tonight” –
      Eagle-Eye Cherry.</p>`,
    keySongs: {
      G: '“Zombie” – The Cranberries',
      C: '“Save Tonight” – Eagle-Eye Cherry',
    },
  },
  {
    id: 'I-IV-V',
    label: 'I – IV – V',
    chords: [I, IV, V],
    defaultRoot: 'C',
    blurb: `<h3>I – IV – V — the three-chord trick</h3>
      <p>Blues, rock’n’roll, punk: whole genres run on nothing but the tonic and its two
      neighbors a fourth and a fifth above. No relative minor, no borrowed chord — just the three
      pillars of the key.</p>
      <p class="known-from">Recognizable from: “La Bamba” – Ritchie Valens, “Twist and Shout” –
      The Beatles, “Wild Thing” – The Troggs.</p>`,
    keySongs: {
      C: '“La Bamba” – Ritchie Valens',
      D: '“Twist and Shout” – The Beatles',
      A: '“Wild Thing” – The Troggs',
    },
  },
  {
    id: 'ii-V-I',
    label: 'ii – V – I',
    chords: [ii, V, I],
    defaultRoot: 'C',
    blurb: `<h3>ii – V – I — the jazz turnaround</h3>
      <p>Jazz harmony’s workhorse cadence: a minor chord falls a fourth to the dominant, which
      resolves home. Learn to hear this motion and you will spot it inside almost any jazz
      standard, often several times per tune.</p>
      <p class="known-from">Recognizable from: the turnaround at the heart of jazz standards like
      “Autumn Leaves” and “Fly Me to the Moon” — real tunes cycle it through several keys, so no
      single chord set owns it.</p>`,
  },
  {
    id: 'i-bVII-bIII-bVI',
    label: 'i – ♭VII – ♭III – ♭VI',
    chords: [i, bVII, bIII, bVI],
    defaultRoot: 'B',
    blurb: `<h3>i – ♭VII – ♭III – ♭VI — the epic minor loop</h3>
      <p>Four chords climbing away from the tonic before circling back — a favorite for
      anthemic, driving choruses. All three upper chords are major, borrowed from the relative
      major key, which is what gives the loop its lift against the minor tonic.</p>`,
  },
  {
    id: 'i-bVII-bVI-V',
    label: 'i – ♭VII – ♭VI – V',
    chords: [i, bVII, bVI, V],
    defaultRoot: 'A',
    blurb: `<h3>i – ♭VII – ♭VI – V — the Andalusian cadence</h3>
      <p>A descending walk from the tonic down to the dominant, one step at a time — flamenco’s
      signature cadence, and a fixture of dramatic rock and film music. Unlike the loop above,
      the last chord is a genuine dominant (major, not the flat-seventh a natural minor scale
      would give): it is what pulls the ear back to the tonic.</p>
      <p class="known-from">Recognizable from: “Hit the Road Jack” – Ray Charles, the textbook
      Andalusian cadence.</p>`,
    keySongs: {
      A: '“Hit the Road Jack” – Ray Charles',
    },
  },
];

const explorerBlocks: Block[] = [
  {
    kind: 'html',
    html: `<p>Chords in a progression are often named by their position in the scale rather than
      by a fixed letter: <strong>I</strong> is the tonic, <strong>V</strong> the fifth degree, and
      so on — uppercase for a major triad, lowercase for a minor one (<strong>vi</strong>,
      <strong>ii</strong>…). A flat before a numeral (<strong>♭VII</strong>, <strong>♭III</strong>,
      <strong>♭VI</strong>) means that chord's root sits a semitone lower than the major scale
      would give — the usual borrowing in minor-key progressions. Written this way, a progression
      describes a <em>shape</em>, independent of the key: I–V–vi–IV is the same idea in C, in G, or
      in any of the twelve keys below.</p>
      <p>Choose a progression, then a chord set: three voice-led positions of that exact set of
      chords will appear (two, when the neck only has room for two), each staying in one hand
      position the same way the I–V–vi–IV example did back in chapter 5.</p>`,
  },
  { kind: 'progressionExplorer', progressions: PROGRESSIONS },
  {
    kind: 'exercise',
    title: 'Make them yours',
    html: `<ol>
      <li>Pick a progression, then step through its default key’s three positions — lower, mid,
        higher — comparing how the shapes tighten as the register rises.</li>
      <li>Before playing each chord change, name the common note(s) with the previous chord, the
        same reflex from chapter 5.</li>
      <li>Switch the chord set to a key that suits your voice, and try humming or singing a melody
        over the progression while you play.</li>
      <li>Recognize a progression from a song you already play? Work out which of these six
        shapes it is, and which chord set matches it.</li>
    </ol>`,
  },
  {
    kind: 'tip',
    html: `<p>These six shapes are re-orderings and borrowings of the same handful of scale
      degrees. Once I–IV–V, ii–V–I and the two minor loops are under your fingers in a couple of
      keys, you can follow along with a surprising share of the music you already listen to.</p>`,
  },
];

export const progressionsChapter: Chapter = {
  title: 'Famous progressions',
  featured: true,
  intro:
    'Six chord loops behind more songs than anyone could count. Choose one, choose a key, and compare up to three voice-led positions of the very same chords.',
  blocks: explorerBlocks,
};
