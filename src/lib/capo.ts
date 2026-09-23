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
  if (transposeSemitones === 0 && capoFret === 0) {
    return { soundingChord: originalChord, shapeChord: originalChord, unsupported: false };
  }

  const soundingChord =
    transposeSemitones !== 0 ? transposeChordSymbol(originalChord, transposeSemitones) : originalChord;

  if (soundingChord === null) {
    return { soundingChord: originalChord, shapeChord: null, unsupported: true };
  }

  const shapeChord = capoFret > 0 ? transposeChordSymbol(soundingChord, -capoFret) : soundingChord;
  return { soundingChord, shapeChord, unsupported: shapeChord === null };
}
