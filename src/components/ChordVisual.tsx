import { memo } from "react";
import type { InstrumentId } from "../data/instruments";
import { UKULELE_STRING_NAMES, getUkuleleChordShape } from "../data/instruments/ukulele";
import { GUITAR_STRING_NAMES, getGuitarChordShape } from "../data/instruments/guitar";
import { BASS_STRING_NAMES, getBassChordShape } from "../data/instruments/bass";
import FretboardDiagram from "./FretboardDiagram";
import PianoDiagram from "./PianoDiagram";

interface Props {
  instrument: InstrumentId;
  chord: string;
  size?: number;
  highlight?: boolean;
}

function ChordVisual({ instrument, chord, size, highlight }: Props) {
  if (instrument === "piano") {
    return <PianoDiagram chord={chord} size={size} highlight={highlight} />;
  }
  if (instrument === "guitar") {
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
