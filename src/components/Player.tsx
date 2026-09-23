import { useMemo, useState } from "react";
import { getArrangement, type Song } from "../data/songs";
import type { InstrumentId } from "../data/instruments";
import { inferSongKey, transposeChordSymbol } from "../lib/chordTheory";
import { resolveCapoChord } from "../lib/capo";
import { findActiveEventIndex, findActiveSection } from "../lib/arrangement";
import { resolveStrumPattern } from "../lib/strum";
import { usePlaybackClock } from "../hooks/usePlaybackClock";
import ChordVisual from "./ChordVisual";
import StrumGuide from "./StrumGuide";
import EqualizerBars from "./EqualizerBars";
import ScalePanel from "./ScalePanel";
import Timeline from "./Timeline";
import {
  IconChevronLeft,
  IconChevronRight,
  IconMetronome,
  IconPause,
  IconPlay,
  IconRepeat,
  IconRestart,
  IconScale,
} from "./icons";

export type ViewMode = "chords" | "visual" | "both";

interface Props {
  song: Song;
  instrument: InstrumentId;
  mode: ViewMode;
}

// Basses are almost never played with a capo in practice; piano must
// always show sounding pitches, so it never gets one either.
const CAPO_INSTRUMENTS: InstrumentId[] = ["guitar", "ukulele"];
const MAX_CAPO_FRET = 12;

export default function Player({ song, instrument, mode }: Props) {
  const arrangement = useMemo(() => getArrangement(song), [song]);
  const { events, sections, totalBeats, bpm, beatsPerBar } = arrangement;

  const clock = usePlaybackClock({ bpm, beatsPerBar, totalBeats });
  const { beat, playing } = clock;

  const [showScale, setShowScale] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);

  const strumPattern = useMemo(
    () => resolveStrumPattern({ songPattern: song.strumPattern, genre: song.genre, beatsPerBar }),
    [song.strumPattern, song.genre, beatsPerBar]
  );

  const capoSupported = CAPO_INSTRUMENTS.includes(instrument);
  const effectiveCapo = capoSupported ? capo : 0;

  function display(rawChord: string) {
    return resolveCapoChord(rawChord, transpose, effectiveCapo);
  }

  // Key inference only cares about what actually sounds, never about
  // which shape a capo lets you finger — so it transposes but ignores capo.
  const inferredKey = useMemo(() => {
    const soundingEvents = events.map((e) => ({
      chord: transpose !== 0 ? (transposeChordSymbol(e.chord, transpose) ?? e.chord) : e.chord,
      beats: e.durationBeats,
    }));
    return inferSongKey(soundingEvents);
  }, [events, transpose]);

  function goToIndex(index: number) {
    const clamped = Math.max(0, Math.min(events.length - 1, index));
    clock.seek(events[clamped].startBeat);
  }

  const currentIndex = findActiveEventIndex(events, beat);
  const current = events[currentIndex] ?? events[0];
  const upcoming = events[currentIndex + 1];
  const currentSection = findActiveSection(sections, beat);
  const currentDisplay = current ? display(current.chord) : null;
  const upcomingDisplay = upcoming ? display(upcoming.chord) : null;
  const showDiagram = mode === "visual" || mode === "both";
  const showChordName = mode === "chords" || mode === "both";

  return (
    <div className="player">
      <div className="player__settings-row">
        <div className="transpose-controls">
          <span className="transpose-controls__label">Transpose</span>
          <button
            className="stepper-btn"
            onClick={() => setTranspose((t) => t - 1)}
            aria-label="Transpose down one semitone"
          >
            −
          </button>
          <span className="transpose-controls__value">{transpose > 0 ? `+${transpose}` : transpose}</span>
          <button
            className="stepper-btn"
            onClick={() => setTranspose((t) => t + 1)}
            aria-label="Transpose up one semitone"
          >
            +
          </button>
          {transpose !== 0 && (
            <button className="transpose-controls__reset" onClick={() => setTranspose(0)}>
              Reset
            </button>
          )}
        </div>

        {capoSupported && (
          <div className="capo-controls">
            <label htmlFor="capo-select">Capo</label>
            <select id="capo-select" value={capo} onChange={(e) => setCapo(Number(e.target.value))}>
              <option value={0}>None</option>
              {Array.from({ length: MAX_CAPO_FRET }, (_, i) => i + 1).map((fret) => (
                <option key={fret} value={fret}>
                  Fret {fret}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {capoSupported && capo > 0 && (
        <p className="settings-hint">
          Capo on fret {capo}: the chord name shows what sounds, the diagram shows the shape to finger.
        </p>
      )}

      <div className="player__viewport">
        <button
          className="nav-arrow"
          onClick={() => goToIndex(currentIndex - 1)}
          disabled={currentIndex <= 0}
          aria-label="Previous chord"
        >
          <IconChevronLeft />
        </button>

        <div className="player__stage">
          <div className="player__now" key={currentIndex}>
            <div className="player__section-row">
              <span className="player__section">{currentSection?.name}</span>
              <EqualizerBars active={playing} />
            </div>
            {showChordName && currentDisplay && (
              <>
                <div
                  className={`player__chord-name${currentDisplay.unsupported ? " player__chord-name--unsupported" : ""}`}
                >
                  {currentDisplay.unsupported ? "Unsupported chord" : currentDisplay.soundingChord}
                </div>
                {!currentDisplay.unsupported && currentDisplay.shapeChord !== currentDisplay.soundingChord && (
                  <div className="player__chord-shape-hint">shape: {currentDisplay.shapeChord}</div>
                )}
              </>
            )}
            {showDiagram && (
              <ChordVisual instrument={instrument} chord={currentDisplay?.shapeChord ?? ""} size={220} highlight />
            )}
          </div>
          {upcoming && upcomingDisplay && (
            <div className="player__next">
              {showDiagram ? (
                <ChordVisual instrument={instrument} chord={upcomingDisplay.shapeChord ?? ""} size={90} />
              ) : (
                <div className="player__chord-name player__chord-name--small">
                  {upcomingDisplay.unsupported ? "?" : upcomingDisplay.soundingChord}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="nav-arrow"
          onClick={() => goToIndex(currentIndex + 1)}
          disabled={currentIndex >= events.length - 1}
          aria-label="Next chord"
        >
          <IconChevronRight />
        </button>
      </div>

      <Timeline arrangement={arrangement} beat={beat} onSeek={clock.seek} />

      {instrument !== "piano" && <StrumGuide pattern={strumPattern} beatPosition={beat} playing={playing} />}

      <div className="player__controls">
        <button className="btn btn--primary btn--icon-label" onClick={clock.toggle}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? "Pause" : beat > 0 ? "Resume" : "Play"}
        </button>
        <button className="btn btn--icon" onClick={clock.restart} title="Restart" aria-label="Restart">
          <IconRestart />
        </button>
        <select
          className="speed-select"
          value={clock.speed}
          onChange={(e) => clock.setSpeed(Number(e.target.value))}
          aria-label="Playback speed"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
        </select>
        <button
          className={`toggle-chip${clock.metronome ? " toggle-chip--active" : ""}`}
          onClick={() => clock.setMetronome(!clock.metronome)}
          aria-pressed={clock.metronome}
        >
          <IconMetronome /> Metronome
        </button>
        <button
          className={`toggle-chip${clock.loop ? " toggle-chip--active" : ""}`}
          onClick={() => clock.setLoop(!clock.loop)}
          aria-pressed={clock.loop}
        >
          <IconRepeat /> Loop
        </button>
        {inferredKey && (
          <button
            className={`toggle-chip${showScale ? " toggle-chip--active" : ""}`}
            onClick={() => setShowScale((s) => !s)}
            aria-pressed={showScale}
          >
            <IconScale /> Scale
          </button>
        )}
      </div>

      {showScale && inferredKey && (
        <ScalePanel instrument={instrument} rootIndex={inferredKey.rootIndex} mode={inferredKey.mode} />
      )}
    </div>
  );
}
