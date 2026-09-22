import { NOTE_NAMES, canonicalizeChordSymbol, parseChord } from "../../lib/chordTheory";

// Standard guitar tuning, low to high.
export const GUITAR_STRING_NAMES = ["E", "A", "D", "G", "B", "e"] as const;

// -1 = muted string. These are the well-known open-position shapes
// most beginner charts teach, so naturals get their familiar fingering.
const OPEN_SHAPES: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  C7: [-1, 3, 2, 3, 1, 0],
  D: [-1, -1, 0, 2, 3, 2],
  Dmaj7: [-1, -1, 0, 2, 2, 2],
  D7: [-1, -1, 0, 2, 1, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  Dsus4: [-1, -1, 0, 2, 3, 3],
  E: [0, 2, 2, 1, 0, 0],
  Emaj7: [0, 2, 1, 1, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  G7: [3, 2, 0, 0, 0, 1],
  Gm: [3, 5, 5, 3, 3, 3],
  A: [-1, 0, 2, 2, 2, 0],
  Amaj7: [-1, 0, 2, 1, 2, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  Asus4: [-1, 0, 2, 2, 3, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  Bm: [-1, 2, 4, 4, 3, 2],
  B: [-1, 2, 4, 4, 4, 2],
};

// Movable "form" shapes used to build any chord not covered above,
// keyed by the open chord they're derived from (E-form / A-form barre).
const E_FORM: Record<string, number[]> = {
  major: [0, 2, 2, 1, 0, 0],
  minor: [0, 2, 2, 0, 0, 0],
  "7": [0, 2, 0, 1, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
};
const A_FORM: Record<string, number[]> = {
  major: [-1, 0, 2, 2, 2, 0],
  minor: [-1, 0, 2, 2, 1, 0],
  "7": [-1, 0, 2, 0, 2, 0],
  maj7: [-1, 0, 2, 1, 2, 0],
  m7: [-1, 0, 2, 0, 1, 0],
};

const QUALITY_KEY: Record<string, keyof typeof E_FORM> = {
  major: "major",
  minor: "minor",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  // no dedicated barre form for sus/dim; fall back to major shape
  sus4: "major",
  sus2: "major",
  dim: "minor",
};

function transpose(form: number[], semitones: number): number[] {
  return form.map((f) => (f === -1 ? -1 : f + semitones));
}

export function getGuitarChordShape(name: string): number[] | undefined {
  const canonical = canonicalizeChordSymbol(name) ?? name;
  if (OPEN_SHAPES[canonical]) return OPEN_SHAPES[canonical];

  const parsed = parseChord(name);
  if (!parsed) return undefined;
  const key = QUALITY_KEY[parsed.quality];
  if (!key) return undefined;

  const eRoot = NOTE_NAMES.indexOf("E");
  const aRoot = NOTE_NAMES.indexOf("A");
  const offsetFromE = (parsed.rootIndex - eRoot + 12) % 12;
  const offsetFromA = (parsed.rootIndex - aRoot + 12) % 12;

  // Prefer whichever barre form lands closer to the nut (easier to play).
  if (offsetFromA <= offsetFromE) {
    return transpose(A_FORM[key], offsetFromA);
  }
  return transpose(E_FORM[key], offsetFromE);
}
