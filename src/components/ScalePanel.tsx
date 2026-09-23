import type { InstrumentId } from "../data/instruments";
import { NOTE_NAMES, getScaleNoteIndices, type ScaleMode } from "../lib/chordTheory";
import ScaleDiagram from "./ScaleDiagram";

interface Props {
  instrument: InstrumentId;
  rootIndex: number;
  mode: ScaleMode;
}

export default function ScalePanel({ instrument, rootIndex, mode }: Props) {
  const noteNames = getScaleNoteIndices(rootIndex, mode).map((i) => NOTE_NAMES[i]);
  const rootName = NOTE_NAMES[rootIndex];
  const modeLabel = mode === "major" ? "Major" : "Minor";

  return (
    <div className="scale-panel">
      <div className="scale-panel__title">
        Suggested scale to jam over this song: <strong>{rootName} {modeLabel}</strong>
      </div>
      <ScaleDiagram instrument={instrument} rootIndex={rootIndex} mode={mode} />
      <div className="scale-panel__notes">{noteNames.join("  ·  ")}</div>
    </div>
  );
}
