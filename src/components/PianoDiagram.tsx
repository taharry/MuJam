import { getPianoChordNotes } from "../data/instruments/piano";
import PianoKeys, { type PianoHighlight } from "./PianoKeys";

export type PianoVoicing = "backing" | "triad" | "both";

interface Props {
  chord: string;
  size?: number;
  highlight?: boolean;
  voicing?: PianoVoicing;
}

export default function PianoDiagram({ chord, size = 140, highlight, voicing = "triad" }: Props) {
  const notes = getPianoChordNotes(chord);
  const root = notes?.[0];

  let octaves = 1;
  let highlights: PianoHighlight[] = [];
  let octaveLabels: string[] | undefined;

  if (notes && root !== undefined) {
    if (voicing === "backing") {
      // Just the bass/root note, the way a simple left-hand accompaniment would play it.
      octaves = 1;
      highlights = [{ octave: 0, pitchClass: root, isRoot: true }];
    } else if (voicing === "triad") {
      // The chord tones alone, in one octave — no hand split.
      octaves = 1;
      highlights = notes.map((n) => ({ octave: 0, pitchClass: n, isRoot: n === root }));
    } else {
      // "both": a real two-hand shape — bass root an octave down on the
      // left, full triad up on the right.
      octaves = 2;
      highlights = [
        { octave: 0, pitchClass: root, isRoot: true },
        ...notes.map((n) => ({ octave: 1, pitchClass: n, isRoot: n === root })),
      ];
      octaveLabels = ["Left hand", "Right hand"];
    }
  }

  return (
    <div className={`uke-diagram${highlight ? " uke-diagram--active" : ""}`} style={{ width: size * octaves }}>
      <div className="uke-diagram__label">{chord}</div>
      <PianoKeys octaves={octaves} highlights={highlights} size={size} octaveLabels={octaveLabels} />
      {!notes && <div className="uke-diagram__missing">notes unknown</div>}
    </div>
  );
}
