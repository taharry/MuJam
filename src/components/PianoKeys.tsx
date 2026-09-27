import { PIANO_BLACK_KEYS, PIANO_WHITE_KEYS } from "../data/instruments/piano";

export interface PianoHighlight {
  /** Which rendered octave (0-based, left to right) this note falls in. */
  octave: number;
  pitchClass: number;
  isRoot: boolean;
}

interface Props {
  /** How many octaves of keys to render side by side. */
  octaves?: number;
  highlights: PianoHighlight[];
  /** Width of a single octave; total width is size * octaves. */
  size?: number;
  /** One label per octave (e.g. "Left hand" / "Right hand"), shown above the keys. */
  octaveLabels?: string[];
}

export default function PianoKeys({ octaves = 1, highlights, size = 140, octaveLabels }: Props) {
  const octaveWidth = size;
  const whiteW = octaveWidth / PIANO_WHITE_KEYS.length;
  const height = size * 1.15;
  const blackH = height * 0.6;
  const blackW = whiteW * 0.6;
  const totalWidth = octaveWidth * octaves;

  function highlightAt(octave: number, pitch: number): PianoHighlight | undefined {
    return highlights.find((h) => h.octave === octave && h.pitchClass === pitch);
  }

  const octaveIndices = Array.from({ length: octaves }, (_, i) => i);

  return (
    <div>
      {octaveLabels && (
        <div className="piano-keys__labels" style={{ width: totalWidth }}>
          {octaveIndices.map((oct) => (
            <span key={oct} className="piano-keys__label" style={{ width: octaveWidth }}>
              {octaveLabels[oct] ?? ""}
            </span>
          ))}
        </div>
      )}
      <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`}>
        {octaveIndices.flatMap((oct) =>
          PIANO_WHITE_KEYS.map((k, i) => {
            const hit = highlightAt(oct, k.pitch);
            return (
              <rect
                key={`w-${oct}-${k.pitch}`}
                x={oct * octaveWidth + i * whiteW}
                y={0}
                width={whiteW}
                height={height}
                className={hit ? "piano-key piano-key--active" : "piano-key"}
                stroke="currentColor"
                strokeWidth={1}
                opacity={hit ? (hit.isRoot ? 1 : 0.5) : 1}
              />
            );
          })
        )}
        {octaveIndices.flatMap((oct) =>
          PIANO_BLACK_KEYS.map((k) => {
            const hit = highlightAt(oct, k.pitch);
            return (
              <rect
                key={`b-${oct}-${k.pitch}`}
                x={oct * octaveWidth + k.offset * whiteW - blackW / 2}
                y={0}
                width={blackW}
                height={blackH}
                className={hit ? "piano-key piano-key--black piano-key--active" : "piano-key piano-key--black"}
                opacity={hit ? (hit.isRoot ? 1 : 0.5) : 1}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
