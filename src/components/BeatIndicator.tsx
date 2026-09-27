interface Props {
  beatsPerBar: number;
  beat: number;
  playing: boolean;
}

// A row of dots, one per beat in the bar, filling on the active beat.
// Driven directly by the same continuous beat position everything else
// reads, so it can't drift out of sync with the chord/strum display.
export default function BeatIndicator({ beatsPerBar, beat, playing }: Props) {
  const activeBeat = playing ? Math.floor(((beat % beatsPerBar) + beatsPerBar) % beatsPerBar) : -1;

  return (
    <div className="beat-indicator" role="presentation">
      {Array.from({ length: beatsPerBar }, (_, i) => (
        <span key={i} className={`beat-indicator__dot${i === activeBeat ? " beat-indicator__dot--active" : ""}`} />
      ))}
    </div>
  );
}
