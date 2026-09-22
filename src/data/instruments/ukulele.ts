import { canonicalizeChordSymbol } from "../../lib/chordTheory";

// Standard ukulele (GCEA, re-entrant) chord fingerings.
// Each shape is [G, C, E, A] fret numbers. Keyed by canonical (sharp)
// spelling only — getUkuleleChordShape normalizes flats before lookup.
export const UKULELE_STRING_NAMES = ["G", "C", "E", "A"] as const;

export const UKULELE_CHORD_SHAPES: Record<string, number[]> = {
  C: [0, 0, 0, 3],
  Cmaj7: [0, 0, 0, 2],
  C7: [0, 0, 0, 1],
  Cm: [0, 3, 3, 3],
  "C#": [1, 1, 1, 4],
  "C#m": [1, 4, 4, 4],
  D: [2, 2, 2, 0],
  Dmaj7: [2, 2, 2, 4],
  D7: [2, 2, 2, 3],
  Dm: [2, 2, 1, 0],
  Dsus4: [2, 2, 3, 0],
  "D#": [3, 3, 3, 1],
  "D#m": [3, 6, 6, 6],
  E: [4, 4, 4, 4],
  Em: [0, 4, 3, 2],
  Em7: [0, 2, 0, 2],
  E7: [1, 2, 0, 2],
  F: [2, 0, 1, 0],
  Fmaj7: [2, 4, 1, 3],
  Fm: [1, 0, 1, 3],
  F7: [2, 3, 1, 1],
  "F#": [3, 1, 2, 1],
  "F#m": [2, 1, 2, 0],
  G: [0, 2, 3, 2],
  Gmaj7: [0, 2, 2, 2],
  G7: [0, 2, 1, 2],
  Gm: [0, 2, 3, 1],
  "G#": [1, 3, 4, 3],
  "G#m": [1, 3, 4, 2],
  A: [2, 1, 0, 0],
  Amaj7: [1, 1, 0, 0],
  Am: [2, 0, 0, 0],
  Am7: [0, 0, 0, 0],
  A7: [0, 1, 0, 0],
  Asus4: [2, 2, 0, 0],
  "A#": [3, 2, 1, 1],
  "A#m": [3, 1, 1, 1],
  B: [4, 3, 2, 2],
  Bm: [4, 2, 2, 2],
  B7: [2, 3, 2, 2],
};

export function getUkuleleChordShape(name: string): number[] | undefined {
  const canonical = canonicalizeChordSymbol(name);
  return UKULELE_CHORD_SHAPES[canonical ?? name];
}
