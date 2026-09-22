import { NOTE_NAMES, parseChord } from "../../lib/chordTheory";

// Standard 4-string bass tuning, low to high.
export const BASS_STRING_NAMES = ["E", "A", "D", "G"] as const;

// Bass typically plays the root note of a chord rather than a full
// voicing, so we find the lowest-fret position of the chord's root
// across the 4 strings and mute the rest — same idea as the guitar
// barre-chord fallback, but resolving to a single note instead of a
// shape, since that's how bass is actually played.
export function getBassChordShape(name: string): number[] | undefined {
  const parsed = parseChord(name);
  if (!parsed) return undefined;

  let bestString = 0;
  let bestFret = Infinity;
  BASS_STRING_NAMES.forEach((openNote, i) => {
    const openIndex = NOTE_NAMES.indexOf(openNote as (typeof NOTE_NAMES)[number]);
    const fret = (parsed.rootIndex - openIndex + 12) % 12;
    if (fret < bestFret) {
      bestFret = fret;
      bestString = i;
    }
  });

  return BASS_STRING_NAMES.map((_, i) => (i === bestString ? bestFret : -1));
}
