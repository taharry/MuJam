import { getPianoChordNotes } from "../data/instruments/piano";
import PianoKeys from "./PianoKeys";

interface Props {
  chord: string;
  size?: number;
  highlight?: boolean;
}

export default function PianoDiagram({ chord, size = 140, highlight }: Props) {
  const notes = getPianoChordNotes(chord);
  const noteSet = new Set(notes ?? []);
  const root = notes?.[0];

  return (
    <div className={`uke-diagram${highlight ? " uke-diagram--active" : ""}`} style={{ width: size }}>
      <div className="uke-diagram__label">{chord}</div>
      <PianoKeys noteSet={noteSet} root={root} size={size} />
      {!notes && <div className="uke-diagram__missing">notes unknown</div>}
    </div>
  );
}
