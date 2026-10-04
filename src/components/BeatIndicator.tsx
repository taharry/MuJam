interface Props {
  beatsPerBar: number;
  beat: number;
  playing: boolean;
}

// A row of numbered segments, one per beat in the bar (whatever the
// song's actual time signature is — never assumed to be 4). The active
// beat is distinguished by fill, size, AND its number, and the
// upcoming beat gets its own distinct outline — so which beat is which
// never depends on color alone.
export default function BeatIndicator({ beatsPerBar, beat, playing }: Props) {
  const activeBeat = playing ? Math.floor(((beat % beatsPerBar) + beatsPerBar) % beatsPerBar) : -1;
  const upcomingBeat = playing ? (activeBeat + 1) % beatsPerBar : -1;

  return (
    <div className="beat-indicator" role="presentation">
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const isActive = i === activeBeat;
        const isUpcoming = i === upcomingBeat && !isActive;
        return (
          <span
            key={i}
            className={`beat-indicator__segment${isActive ? " beat-indicator__segment--active" : ""}${
              isUpcoming ? " beat-indicator__segment--upcoming" : ""
            }`}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}
