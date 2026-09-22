import { getPianoChordNotes } from "../data/instruments/piano";

interface Props {
  chord: string;
  size?: number;
  highlight?: boolean;
}

// One octave, C to B. Pitch classes 0-11 map to these key definitions.
const WHITE_KEYS = [
  { pitch: 0, label: "C" },
  { pitch: 2, label: "D" },
  { pitch: 4, label: "E" },
  { pitch: 5, label: "F" },
  { pitch: 7, label: "G" },
  { pitch: 9, label: "A" },
  { pitch: 11, label: "B" },
];
// Position (in white-key units from the left) each black key sits between.
const BLACK_KEYS = [
  { pitch: 1, offset: 0.72 },
  { pitch: 3, offset: 1.72 },
  { pitch: 6, offset: 3.72 },
  { pitch: 8, offset: 4.72 },
  { pitch: 10, offset: 5.72 },
];

export default function PianoDiagram({ chord, size = 140, highlight }: Props) {
  const notes = getPianoChordNotes(chord);
  const noteSet = new Set(notes ?? []);
  const root = notes?.[0];

  const width = size;
  const whiteW = width / WHITE_KEYS.length;
  const height = size * 1.15;
  const blackH = height * 0.6;
  const blackW = whiteW * 0.6;

  return (
    <div className={`uke-diagram${highlight ? " uke-diagram--active" : ""}`} style={{ width }}>
      <div className="uke-diagram__label">{chord}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {WHITE_KEYS.map((k, i) => (
          <rect
            key={`w-${k.pitch}`}
            x={i * whiteW}
            y={0}
            width={whiteW}
            height={height}
            className={noteSet.has(k.pitch) ? "piano-key piano-key--active" : "piano-key"}
            stroke="currentColor"
            strokeWidth={1}
            opacity={noteSet.has(k.pitch) ? (k.pitch === root ? 1 : 0.5) : 1}
          />
        ))}
        {BLACK_KEYS.map((k) => (
          <rect
            key={`b-${k.pitch}`}
            x={k.offset * whiteW - blackW / 2}
            y={0}
            width={blackW}
            height={blackH}
            className={
              noteSet.has(k.pitch)
                ? "piano-key piano-key--black piano-key--active"
                : "piano-key piano-key--black"
            }
            opacity={noteSet.has(k.pitch) ? (k.pitch === root ? 1 : 0.5) : 1}
          />
        ))}
      </svg>
      {!notes && <div className="uke-diagram__missing">notes unknown</div>}
    </div>
  );
}
