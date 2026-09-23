import { useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "../data/songs";
import type { InstrumentId } from "../data/instruments";
import { inferSongKey } from "../lib/chordTheory";
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

interface FlatEvent {
  chord: string;
  section: string;
  startBeat: number;
  beats: number;
}

function flatten(song: Song): { events: FlatEvent[]; totalBeats: number } {
  const events: FlatEvent[] = [];
  let cursor = 0;
  for (const section of song.sections) {
    for (const e of section.chords) {
      events.push({ chord: e.chord, section: section.name, startBeat: cursor, beats: e.beats });
      cursor += e.beats;
    }
  }
  return { events, totalBeats: cursor };
}

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
  const { events, totalBeats } = useMemo(() => flatten(song), [song]);
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [metronome, setMetronome] = useState(true);
  const [loop, setLoop] = useState(true);
  const [showScale, setShowScale] = useState(false);
  const inferredKey = useMemo(() => inferSongKey(events), [events]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [strumSlot, setStrumSlot] = useState(0);

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
    const msPerBeat = (60000 / song.bpm) / speed;
    intervalRef.current = window.setInterval(() => {
      lastTickRef.current = performance.now();
      setBeat((b) => {
        const nextBeat = b + 1;
        if (metronome && audioCtxRef.current) {
          const beatInBar = nextBeat % song.beatsPerBar;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, metronome, loop]);

  // Drives the strum-pattern highlight at eighth-note resolution, derived
  // from the same clock as the beat interval above (rather than a second
  // independent timer) so it can't drift out of sync with playback.
  useEffect(() => {
    if (!playing) {
      setStrumSlot(0);
      return;
    }
    const msPerBeat = (60000 / song.bpm) / speed;
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
  }, [playing, speed, song.bpm]);

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

  const currentIndex = events.findIndex(
    (e) => beat >= e.startBeat && beat < e.startBeat + e.beats
  );
  const current = events[currentIndex] ?? events[0];
  const upcoming = events[currentIndex + 1];
  const progressPct = totalBeats ? (beat / totalBeats) * 100 : 0;
  const showDiagram = mode === "visual" || mode === "both";
  const showChordName = mode === "chords" || mode === "both";
  const beatInBar = beat % song.beatsPerBar;
  const activeStrumIndex = playing ? beatInBar * 2 + strumSlot : -1;

  return (
    <div className="player">
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
              <span className="player__section">{current?.section}</span>
              <EqualizerBars active={playing} />
            </div>
            {showChordName && <div className="player__chord-name">{current?.chord}</div>}
            {showDiagram && (
              <ChordVisual instrument={instrument} chord={current?.chord ?? ""} size={220} highlight />
            )}
          </div>
          {upcoming && (
            <div className="player__next">
              {showDiagram ? (
                <ChordVisual instrument={instrument} chord={upcoming.chord} size={90} />
              ) : (
                <div className="player__chord-name player__chord-name--small">
                  {upcoming.chord}
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
          {events.map((e, i) => (
            <button
              key={`${e.chord}-${e.startBeat}`}
              className={`chord-strip__item${i === currentIndex ? " chord-strip__item--active" : ""}`}
              onClick={() => goToIndex(i)}
              title={`Jump to this ${e.chord}`}
            >
              {e.chord}
            </button>
          ))}
        </div>
      )}

      {instrument !== "piano" && (
        <StrumGuide genre={song.genre} beatsPerBar={song.beatsPerBar} activeIndex={activeStrumIndex} />
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
