import { useEffect, useMemo, useRef, useState } from "react";
import { getArrangement, type Song } from "../data/songs";
import type { InstrumentId } from "../data/instruments";
import { inferSongKey, transposeChordSymbol } from "../lib/chordTheory";
import { resolveCapoChord } from "../lib/capo";
import { findActiveEventIndex, findActiveSection } from "../lib/arrangement";
import ChordVisual from "./ChordVisual";
import StrumGuide from "./StrumGuide";
import EqualizerBars from "./EqualizerBars";
import ScalePanel from "./ScalePanel";
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

function playClick(ctx: AudioContext, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1200 : 800;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export default function Player({ song, instrument, mode }: Props) {
  const arrangement = useMemo(() => getArrangement(song), [song]);
  const { events, sections, totalBeats, bpm, beatsPerBar } = arrangement;

  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [metronome, setMetronome] = useState(true);
  const [loop, setLoop] = useState(true);
  const [showScale, setShowScale] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [strumSlot, setStrumSlot] = useState(0);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    const msPerBeat = 60000 / bpm / speed;
    intervalRef.current = window.setInterval(() => {
      lastTickRef.current = performance.now();
      setBeat((b) => {
        const nextBeat = b + 1;
        if (metronome && audioCtxRef.current) {
          const beatInBar = nextBeat % beatsPerBar;
          playClick(audioCtxRef.current, beatInBar === 0);
        }
        if (nextBeat >= totalBeats) {
          if (loop) return 0;
          setPlaying(false);
          return totalBeats - 1;
        }
        return nextBeat;
      });
    }, msPerBeat);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [playing, speed, metronome, loop, bpm, beatsPerBar, totalBeats]);

  // Drives the strum-pattern highlight at eighth-note resolution, derived
  // from the same clock as the beat interval above (rather than a second
  // independent timer) so it can't drift out of sync with playback.
  useEffect(() => {
    if (!playing) {
      setStrumSlot(0);
      return;
    }
    const msPerBeat = 60000 / bpm / speed;
    function tick() {
      const elapsed = performance.now() - lastTickRef.current;
      const frac = Math.min(elapsed / msPerBeat, 0.999);
      setStrumSlot(frac < 0.5 ? 0 : 1);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, bpm]);

  function toggle() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (beat >= totalBeats - 1 && !playing) {
      setBeat(0);
    }
    lastTickRef.current = performance.now();
    setPlaying((p) => !p);
  }

  function restart() {
    setBeat(0);
  }

  function goToIndex(index: number) {
    const clamped = Math.max(0, Math.min(events.length - 1, index));
    setBeat(events[clamped].startBeat);
  }

  const currentIndex = findActiveEventIndex(events, beat);
  const current = events[currentIndex] ?? events[0];
  const upcoming = events[currentIndex + 1];
  const currentSection = findActiveSection(sections, beat);
  const currentDisplay = current ? display(current.chord) : null;
  const upcomingDisplay = upcoming ? display(upcoming.chord) : null;
  const progressPct = totalBeats ? (beat / totalBeats) * 100 : 0;
  const showDiagram = mode === "visual" || mode === "both";
  const showChordName = mode === "chords" || mode === "both";
  const beatInBar = beat % beatsPerBar;
  const activeStrumIndex = playing ? beatInBar * 2 + strumSlot : -1;

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
            <select
              id="capo-select"
              value={capo}
              onChange={(e) => setCapo(Number(e.target.value))}
            >
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
                <div className={`player__chord-name${currentDisplay.unsupported ? " player__chord-name--unsupported" : ""}`}>
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

      <div className="player__progress">
        <div className="player__progress-bar" style={{ width: `${progressPct}%` }} />
      </div>

      {mode !== "visual" && (
        <div className="chord-strip">
          {events.map((e, i) => {
            const d = display(e.chord);
            const label = d.unsupported ? "?" : d.soundingChord;
            return (
              <button
                key={`${e.chord}-${e.startBeat}`}
                className={`chord-strip__item${i === currentIndex ? " chord-strip__item--active" : ""}`}
                onClick={() => goToIndex(i)}
                title={`Jump to this ${label}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {instrument !== "piano" && (
        <StrumGuide genre={song.genre} beatsPerBar={beatsPerBar} activeIndex={activeStrumIndex} />
      )}

      <div className="player__controls">
        <button className="btn btn--primary btn--icon-label" onClick={toggle}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? "Pause" : beat > 0 ? "Resume" : "Play"}
        </button>
        <button className="btn btn--icon" onClick={restart} title="Restart" aria-label="Restart">
          <IconRestart />
        </button>
        <select
          className="speed-select"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="Playback speed"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
        </select>
        <button
          className={`toggle-chip${metronome ? " toggle-chip--active" : ""}`}
          onClick={() => setMetronome((m) => !m)}
          aria-pressed={metronome}
        >
          <IconMetronome /> Metronome
        </button>
        <button
          className={`toggle-chip${loop ? " toggle-chip--active" : ""}`}
          onClick={() => setLoop((l) => !l)}
          aria-pressed={loop}
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
