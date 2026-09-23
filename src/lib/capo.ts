import { transposeChordSymbol } from "./chordTheory";

export interface CapoResolution {
  /** What actually sounds, after any transposition. */
  soundingChord: string;
  /** What shape to finger, relative to the capo. Null if the chord couldn't be transposed. */
  shapeChord: string | null;
  unsupported: boolean;
}

// Order matters: transpose is applied to the sounding chord first, then
// the capo offset is removed to get the shape the player should finger.
// A capo raises the pitch, so fretting a shape "capoFret" semitones
// lower than the sounding chord reproduces it.
export function resolveCapoChord(
  originalChord: string,
  transposeSemitones: number,
  capoFret: number
): CapoResolution {
  // Always resolve through the parser, even at transpose 0 / capo 0 —
  // an unsupported symbol (e.g. Cadd9) should be reported as such
  // regardless of the current transpose/capo settings, not only once
  // the user actually tries to transform it.
  const soundingChord = transposeChordSymbol(originalChord, transposeSemitones);

  if (soundingChord === null) {
    return { soundingChord: originalChord, shapeChord: null, unsupported: true };
  }

  const shapeChord = capoFret > 0 ? transposeChordSymbol(soundingChord, -capoFret) : soundingChord;
  return { soundingChord, shapeChord, unsupported: shapeChord === null };
}
