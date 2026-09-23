import { useState } from "react";
import type { Arrangement } from "../lib/arrangement";

interface Props {
  arrangement: Arrangement;
  beat: number;
  onSeek: (beat: number) => void;
}

// How wide one beat gets when a song is long enough to need horizontal
// scroll. Short songs just stretch to fill the available width instead
// (see .timeline__track's width:100% + this as a min-width floor).
const PX_PER_BEAT = 18;

const SOURCE_LABEL: Record<Arrangement["source"], string> = {
  verified: "Verified full arrangement",
  simplified: "Simplified progression",
};

// Reused by both internal practice mode and YouTube mode — it only
// needs a beat position and a seek callback, not where they come from.
export default function Timeline({ arrangement, beat, onSeek }: Props) {
  const { events, sections, totalBeats, source } = arrangement;
  const [snapToBeat, setSnapToBeat] = useState(true);

  function pct(duration: number): string {
    return totalBeats > 0 ? `${(duration / totalBeats) * 100}%` : "0%";
  }

  return (
    <div className="timeline">
      <div className="timeline__meta">
        <span className={`timeline__source timeline__source--${source}`}>{SOURCE_LABEL[source]}</span>
        <label className="timeline__snap">
          <input type="checkbox" checked={snapToBeat} onChange={(e) => setSnapToBeat(e.target.checked)} />
          Snap to beat
        </label>
      </div>

      <div className="timeline__scroll">
        <div className="timeline__track" style={{ minWidth: `${Math.max(totalBeats * PX_PER_BEAT, 1)}px` }}>
          <div className="timeline__sections" aria-hidden="true">
            {sections.map((s, i) => (
              <div key={i} className="timeline__section" style={{ width: pct(s.durationBeats) }} title={s.name}>
                <span>{s.name}</span>
              </div>
            ))}
          </div>

          <div className="timeline__chords" role="group" aria-label="Chord events">
            {events.map((e, i) => {
              const isActive = beat >= e.startBeat && beat < e.startBeat + e.durationBeats;
              const isUpcoming = !isActive && e.startBeat > beat;
              return (
                <button
                  key={i}
                  className={`timeline__chord${isActive ? " timeline__chord--active" : ""}${
                    isUpcoming ? " timeline__chord--upcoming" : ""
                  }`}
                  style={{ width: pct(e.durationBeats) }}
                  onClick={() => onSeek(e.startBeat)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`${e.chord}, beat ${Math.round(e.startBeat)}${isActive ? ", now playing" : ""}`}
                >
                  <span>{e.chord}</span>
                </button>
              );
            })}
          </div>

          <input
            type="range"
            className="timeline__rail"
            min={0}
            max={Math.max(totalBeats, 0.001)}
            step={snapToBeat ? 1 : 0.05}
            value={Math.min(beat, totalBeats)}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Seek within the song, in beats"
          />
        </div>
      </div>
    </div>
  );
}
