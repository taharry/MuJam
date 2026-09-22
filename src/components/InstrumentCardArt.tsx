interface Props {
  variant: "strings" | "keys";
  strings?: number;
}

// Purely decorative background texture for an instrument picker card —
// a generic fretboard-grid motif for stringed instruments, or a piano
// key row for piano. Not tied to any real chord or song.
export default function InstrumentCardArt({ variant, strings = 6 }: Props) {
  if (variant === "keys") {
    const whiteCount = 7;
    const blackAfter = [0, 1, 3, 4, 5]; // skip between E-F and B-C
    return (
      <svg className="instrument-card__art" viewBox="0 0 140 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {Array.from({ length: whiteCount }).map((_, i) => (
          <rect key={`w-${i}`} x={i * 20} y={30} width={20} height={70} fill="none" stroke="currentColor" strokeWidth={1.5} />
        ))}
        {blackAfter.map((i) => (
          <rect key={`b-${i}`} x={i * 20 + 13} y={30} width={14} height={42} fill="currentColor" />
        ))}
      </svg>
    );
  }

  const gap = 100 / (strings - 1);
  const dots: Array<[number, number]> = [
    [0, 1],
    [Math.floor(strings / 2), 2],
    [strings - 1, 1],
  ];

  return (
    <svg className="instrument-card__art" viewBox="0 0 140 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: strings }).map((_, i) => (
        <line key={`s-${i}`} x1={20 + i * gap} y1={8} x2={20 + i * gap} y2={92} stroke="currentColor" strokeWidth={1.5} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`f-${i}`} x1={20} y1={8 + i * 21} x2={120} y2={8 + i * 21} stroke="currentColor" strokeWidth={1} />
      ))}
      {dots.map(([s, f], idx) => (
        <circle key={idx} cx={20 + s * gap} cy={8 + f * 21 + 10} r={6} fill="currentColor" />
      ))}
    </svg>
  );
}
