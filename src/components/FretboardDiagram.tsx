interface Props {
  chord: string;
  stringNames: readonly string[];
  frets: number[] | undefined;
  size?: number;
  highlight?: boolean;
}

const FRETS_SHOWN = 5;

export default function FretboardDiagram({
  chord,
  stringNames,
  frets,
  size = 140,
  highlight,
}: Props) {
  const width = size;
  const height = size * 1.25;
  const padTop = height * 0.22;
  const padSide = width * 0.12;
  const nameY = padTop * 0.35;
  const indicatorY = padTop * 0.72;
  const gridW = width - padSide * 2;
  const gridH = height - padTop - height * 0.06;
  const stringGap = gridW / (stringNames.length - 1);
  const fretGap = gridH / FRETS_SHOWN;

  const playedFrets = frets?.filter((f) => f > 0) ?? [];
  const maxFret = playedFrets.length ? Math.max(...playedFrets) : 0;
  const fretOffset = maxFret > FRETS_SHOWN ? maxFret - FRETS_SHOWN : 0;

  return (
    <div className={`uke-diagram${highlight ? " uke-diagram--active" : ""}`} style={{ width }}>
      <div className="uke-diagram__label">{chord}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={padSide} y={padTop} width={gridW} height={fretOffset > 0 ? 2 : 5} fill="currentColor" />
        {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padSide}
            y1={padTop + i * fretGap}
            x2={padSide + gridW}
            y2={padTop + i * fretGap}
            stroke="currentColor"
            strokeWidth={i === 0 ? 0 : 1.5}
            opacity={0.5}
          />
        ))}
        {stringNames.map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padSide + i * stringGap}
            y1={padTop}
            x2={padSide + i * stringGap}
            y2={padTop + gridH}
            stroke="currentColor"
            strokeWidth={2}
            opacity={0.7}
          />
        ))}
        {stringNames.map((n, i) => (
          <text
            key={`name-${i}`}
            x={padSide + i * stringGap}
            y={nameY}
            fontSize={11}
            textAnchor="middle"
            fill="currentColor"
          >
            {n}
          </text>
        ))}
        {frets &&
          frets.map((fret, i) => {
            const x = padSide + i * stringGap;
            if (fret === -1) {
              return (
                <text
                  key={`mute-${i}`}
                  x={x}
                  y={indicatorY}
                  fontSize={13}
                  textAnchor="middle"
                  fill="currentColor"
                  opacity={0.6}
                >
                  ×
                </text>
              );
            }
            if (fret === 0) {
              return (
                <circle
                  key={`open-${i}`}
                  cx={x}
                  cy={indicatorY}
                  r={4.5}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              );
            }
            const displayFret = fret - fretOffset;
            if (displayFret < 1 || displayFret > FRETS_SHOWN) return null;
            const y = padTop + (displayFret - 0.5) * fretGap;
            const dotR = fretGap * 0.34;
            return (
              <g key={`dot-${i}`}>
                <circle cx={x} cy={y} r={dotR} className="uke-diagram__dot" />
                <text
                  x={x}
                  y={y}
                  fontSize={dotR * 1.15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="uke-diagram__dot-label"
                >
                  {fret}
                </text>
              </g>
            );
          })}
      </svg>
      {!frets && <div className="uke-diagram__missing">shape coming soon</div>}
    </div>
  );
}
