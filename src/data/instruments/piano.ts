import { getChordNoteIndices } from "../../lib/chordTheory";

export function getPianoChordNotes(name: string): number[] | undefined {
  return getChordNoteIndices(name) ?? undefined;
}
