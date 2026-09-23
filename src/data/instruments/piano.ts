import { getChordNoteIndices } from "../../lib/chordTheory";

export function getPianoChordNotes(name: string): number[] | undefined {
  return getChordNoteIndices(name) ?? undefined;
}

// One octave, C to B. Pitch classes 0-11 map to these key definitions.
export const PIANO_WHITE_KEYS = [
  { pitch: 0, label: "C" },
  { pitch: 2, label: "D" },
  { pitch: 4, label: "E" },
  { pitch: 5, label: "F" },
  { pitch: 7, label: "G" },
  { pitch: 9, label: "A" },
  { pitch: 11, label: "B" },
];
// Position (in white-key units from the left) each black key sits between.
export const PIANO_BLACK_KEYS = [
  { pitch: 1, offset: 0.72 },
  { pitch: 3, offset: 1.72 },
  { pitch: 6, offset: 3.72 },
  { pitch: 8, offset: 4.72 },
  { pitch: 10, offset: 5.72 },
];
