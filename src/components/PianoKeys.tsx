import { PIANO_BLACK_KEYS, PIANO_WHITE_KEYS } from "../data/instruments/piano";

interface Props {
  noteSet: Set<number>;
  root?: number;
  size?: number;
}

export default function PianoKeys({ noteSet, root, size = 140 }: Props) {
  const width = size;
  const whiteW = width / PIANO_WHITE_KEYS.length;
  const height = size * 1.15;
  const blackH = height * 0.6;
  const blackW = whiteW * 0.6;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {PIANO_WHITE_KEYS.map((k, i) => (
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
      {PIANO_BLACK_KEYS.map((k) => (
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
  );
}
