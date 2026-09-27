import { memo } from "react";
import type { InstrumentId } from "../data/instruments";
import { UKULELE_STRING_NAMES, getUkuleleChordShape } from "../data/instruments/ukulele";
import { GUITAR_STRING_NAMES, getGuitarChordShape } from "../data/instruments/guitar";
import { BASS_STRING_NAMES, getBassChordShape } from "../data/instruments/bass";
import FretboardDiagram from "./FretboardDiagram";
import PianoDiagram, { type PianoVoicing } from "./PianoDiagram";

interface Props {
  instrument: InstrumentId;
  chord: string;
  size?: number;
  highlight?: boolean;
  pianoVoicing?: PianoVoicing;
}

function ChordVisual({ instrument, chord, size, highlight, pianoVoicing }: Props) {
  if (instrument === "piano") {
    return <PianoDiagram chord={chord} size={size} highlight={highlight} voicing={pianoVoicing} />;
  }
  if (instrument === "guitar" || instrument === "electric-guitar") {
    // Standard electric-guitar tuning is identical to acoustic, so the
    // same shapes apply — this is a distinct instrument choice for the
    // player, not a different fretboard.
    return (
      <FretboardDiagram
        chord={chord}
        stringNames={GUITAR_STRING_NAMES}
        frets={getGuitarChordShape(chord)}
        size={size}
        highlight={highlight}
      />
    );
  }
  if (instrument === "bass") {
    return (
      <FretboardDiagram
        chord={chord}
        stringNames={BASS_STRING_NAMES}
        frets={getBassChordShape(chord)}
        size={size}
        highlight={highlight}
      />
    );
  }
  return (
    <FretboardDiagram
      chord={chord}
      stringNames={UKULELE_STRING_NAMES}
      frets={getUkuleleChordShape(chord)}
      size={size}
      highlight={highlight}
    />
  );
}

export default memo(ChordVisual);
