import { useEffect, useMemo, useState } from "react";
import { getArrangement, type Song } from "../data/songs";
import type { InstrumentId } from "../data/instruments";
import { NOTE_NAMES, getBeginnerAlternative, getChordNoteIndices, inferSongKey, transposeChordSymbol } from "../lib/chordTheory";
import { resolveCapoChord } from "../lib/capo";
import { findActiveEventIndex, findActiveSection } from "../lib/arrangement";
import { resolveStrumPattern } from "../lib/strum";
import { supportsPlaybackRateControl } from "../lib/youtubeSync";
import { getStoredSyncOffset, setStoredSyncOffset } from "../lib/syncOffsetStore";
import { getStoredPracticeLevel, setStoredPracticeLevel, type PracticeLevel } from "../lib/practiceLevelStore";
import { usePlaybackClock } from "../hooks/usePlaybackClock";
import { useYouTubeSync } from "../hooks/useYouTubeSync";
import { useCountIn } from "../hooks/useCountIn";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import ChordVisual from "./ChordVisual";
import type { PianoVoicing } from "./PianoDiagram";
import StrumGuide from "./StrumGuide";
import EqualizerBars from "./EqualizerBars";
import BeatIndicator from "./BeatIndicator";
import ScalePanel from "./ScalePanel";
import Timeline from "./Timeline";
import ShortcutsHelp from "./ShortcutsHelp";
import {
  IconChevronLeft,
  IconChevronRight,
  IconFocus,
  IconHelp,
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
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

// Basses are almost never played with a capo in practice; piano must
// always show sounding pitches, so it never gets one either.
const CAPO_INSTRUMENTS: InstrumentId[] = ["guitar", "electric-guitar", "ukulele"];
const MAX_CAPO_FRET = 12;
const MIN_TEMPO_BPM = 40;
const MAX_TEMPO_BPM = 300;
const TEMPO_STEP_BPM = 5;
const PIANO_VOICINGS: { id: PianoVoicing; label: string }[] = [
  { id: "backing", label: "Backing" },
  { id: "triad", label: "Triad" },
  { id: "both", label: "Both" },
];
const PRACTICE_LEVELS: { id: PracticeLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];
const COUNT_IN_OPTIONS: { id: 0 | 1 | 2; label: string }[] = [
  { id: 0, label: "Off" },
  { id: 1, label: "1 bar" },
  { id: 2, label: "2 bars" },
];
const BEGINNER_DEFAULT_SPEED = 0.75;

export default function Player({ song, instrument, mode, focusMode, onToggleFocusMode }: Props) {
  const arrangement = useMemo(() => getArrangement(song), [song]);
  const { events, sections, totalBeats, bpm, beatsPerBar } = arrangement;

  const clock = usePlaybackClock({ bpm, beatsPerBar, totalBeats });
  const countIn = useCountIn();

  const [showScale, setShowScale] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [pianoVoicing, setPianoVoicing] = useState<PianoVoicing>("triad");
  const [videoMode, setVideoMode] = useState(false);
  const [syncOffset, setSyncOffset] = useState(() => getStoredSyncOffset(song.id));
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>(() => getStoredPracticeLevel());
  const [countInMeasures, setCountInMeasures] = useState<0 | 1 | 2>(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const hasVideo = !!song.youtubeId;
  const {
    containerRef: youtubeContainerRef,
    status: youtubeStatus,
    errorMessage: youtubeError,
    beat: youtubeBeat,
    playing: youtubePlaying,
    play: youtubePlay,
    toggle: youtubeToggle,
    seek: youtubeSeek,
    availableRates: youtubeRates,
    setPlaybackRate: setYoutubeRate,
  } = useYouTubeSync({
    videoId: song.youtubeId ?? "",
    offsetSeconds: syncOffset,
    bpm,
    enabled: videoMode && hasVideo,
  });
  const videoActive = videoMode && hasVideo && youtubeStatus === "ready";

  // The active mode's clock is authoritative for everything below —
  // the video's own position when it's active and ready, the internal
  // practice clock otherwise (including while the video is still
  // loading or failed, so the UI never sits on a frozen/undefined beat).
  const beat = videoActive ? youtubeBeat : clock.beat;
  const playing = videoActive ? youtubePlaying : clock.playing;
  const rawToggle = videoActive ? youtubeToggle : clock.toggle;
  const rawSeek = videoActive ? youtubeSeek : clock.seek;
  const rawPlay = videoActive ? youtubePlay : clock.play;

  // Any explicit seek cancels a count-in in progress — jumping
  // somewhere else mid-count-in would make the countdown meaningless.
  function seek(targetBeat: number) {
    if (countIn.active) countIn.cancel();
    rawSeek(targetBeat);
  }

  // Pressing Play starts an optional count-in first; pressing it again
  // while counting in cancels the count-in instead of starting
  // playback early. The external video (if active) is never started
  // until the count-in has actually finished.
  function handlePlayPress() {
    if (playing) {
      rawToggle();
      return;
    }
    if (countIn.active) {
      countIn.cancel();
      return;
    }
    if (countInMeasures > 0) {
      const countInSpeed = videoActive ? 1 : clock.speed;
      countIn.start(countInMeasures, beatsPerBar, bpm, countInSpeed, rawPlay);
    } else {
      rawToggle();
    }
  }

  // Applies the beginner default speed once on load if that's the
  // saved preference — without this, a returning beginner-level user
  // would see the standard 1x default until they re-clicked the level.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (practiceLevel === "beginner") clock.setSpeed(BEGINNER_DEFAULT_SPEED);
  }, []);

  function changePracticeLevel(next: PracticeLevel) {
    setPracticeLevel(next);
    setStoredPracticeLevel(next);
    // "Slower default practice settings" for Beginner — a default, not
    // a lock, so switching away restores the standard default too.
    clock.setSpeed(next === "beginner" ? BEGINNER_DEFAULT_SPEED : 1);
  }

  function adjustSyncOffset(deltaSeconds: number) {
    setSyncOffset((prev) => {
      const next = Math.round((prev + deltaSeconds) * 10) / 10;
      setStoredSyncOffset(song.id, next);
      return next;
    });
  }

  // The clock only knows a speed multiplier; tempo is displayed and
  // edited in actual BPM by converting through the song's native bpm.
  const targetBpm = Math.round(bpm * clock.speed);
  function setTargetBpm(nextBpm: number) {
    const clamped = Math.max(MIN_TEMPO_BPM, Math.min(MAX_TEMPO_BPM, nextBpm));
    clock.setSpeed(clamped / bpm);
  }

  const strumPattern = useMemo(
    () => resolveStrumPattern({ songPattern: song.strumPattern, genre: song.genre, beatsPerBar }),
    [song.strumPattern, song.genre, beatsPerBar]
  );

  const capoSupported = CAPO_INSTRUMENTS.includes(instrument);
  const effectiveCapo = capoSupported ? capo : 0;

  // Separates the song's true sounding chord from how THIS level
  // practices it: beginner may substitute a simpler chord (never
  // silently — always reported), intermediate/advanced always use the
  // arrangement's real chord. Transpose/capo apply afterward either
  // way, so they keep working identically across levels.
  function practiceChord(rawChord: string) {
    if (practiceLevel !== "beginner") return { chord: rawChord, beginner: null as ReturnType<typeof getBeginnerAlternative> | null };
    const alt = getBeginnerAlternative(rawChord);
    if (alt.kind === "simplified") return { chord: alt.chord, beginner: alt };
    return { chord: rawChord, beginner: alt.kind === "unavailable" ? alt : null };
  }

  function display(rawChord: string) {
    const practiced = practiceChord(rawChord);
    return { ...resolveCapoChord(practiced.chord, transpose, effectiveCapo), beginner: practiced.beginner, original: rawChord };
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
    seek(events[clamped].startBeat);
  }

  useKeyboardShortcuts(
    {
      onPlayPause: handlePlayPress,
      onSeekBackward: () => seek(Math.max(0, beat - 1)),
      onSeekForward: () => seek(Math.min(totalBeats, beat + 1)),
      onToggleLoop: () => {
        if (!videoActive) clock.setLoop(!clock.loop);
      },
      onToggleMetronome: () => {
        if (!videoActive) clock.setMetronome(!clock.metronome);
      },
      onToggleHelp: () => setHelpOpen((h) => !h),
    },
    true,
    helpOpen
  );

  const currentIndex = findActiveEventIndex(events, beat);
  const current = events[currentIndex] ?? events[0];
  const upcoming = events[currentIndex + 1];
  const isLastEvent = currentIndex === events.length - 1;
  // On the last chord: if looping is on (practice mode only — a video
  // has no independent loop of its own), the "next" chord is really the
  // arrangement's first one again, at the wrap point; otherwise there
  // genuinely isn't a next chord, which the preview should say plainly
  // rather than just disappearing.
  const willLoopToStart = isLastEvent && !videoActive && clock.loop;
  const nextEvent = upcoming ?? (willLoopToStart ? events[0] : undefined);
  const beatsToNext = nextEvent ? Math.max(0, (upcoming ? upcoming.startBeat : totalBeats) - beat) : null;

  const currentSection = findActiveSection(sections, beat);
  const currentDisplay = current ? display(current.chord) : null;
  const nextDisplay = nextEvent ? display(nextEvent.chord) : null;
  const showDiagram = mode === "visual" || mode === "both";
  const showChordName = mode === "chords" || mode === "both";
  const advancedNotes =
    practiceLevel === "advanced" && currentDisplay && !currentDisplay.unsupported
      ? getChordNoteIndices(currentDisplay.soundingChord)
      : null;

  return (
    <div className={`player${focusMode ? " player--focus" : ""}`}>
      {!focusMode && (
        <>
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

            {!videoActive && (
              <div className="tempo-controls">
                <span className="tempo-controls__label">Tempo</span>
                <button
                  className="stepper-btn"
                  onClick={() => setTargetBpm(targetBpm - TEMPO_STEP_BPM)}
                  disabled={targetBpm <= MIN_TEMPO_BPM}
                  aria-label="Decrease tempo"
                >
                  −
                </button>
                <span className="tempo-controls__value">{targetBpm} BPM</span>
                <button
                  className="stepper-btn"
                  onClick={() => setTargetBpm(targetBpm + TEMPO_STEP_BPM)}
                  disabled={targetBpm >= MAX_TEMPO_BPM}
                  aria-label="Increase tempo"
                >
                  +
                </button>
                {clock.speed !== 1 && (
                  <button className="tempo-controls__reset" onClick={() => clock.setSpeed(1)}>
                    Reset
                  </button>
                )}
              </div>
            )}

            {capoSupported && (
              <div className="capo-controls">
                <span className="capo-controls__label">Capo</span>
                <button
                  className="stepper-btn"
                  onClick={() => setCapo((c) => Math.max(0, c - 1))}
                  disabled={capo === 0}
                  aria-label="Move capo down one fret"
                >
                  −
                </button>
                <span className="capo-controls__value">{capo === 0 ? "Off" : `Fret ${capo}`}</span>
                <button
                  className="stepper-btn"
                  onClick={() => setCapo((c) => Math.min(MAX_CAPO_FRET, c + 1))}
                  disabled={capo === MAX_CAPO_FRET}
                  aria-label="Move capo up one fret"
                >
                  +
                </button>
              </div>
            )}

            {instrument === "piano" && (
              <div className="mode-switch mode-switch--voicing">
                {PIANO_VOICINGS.map((v) => (
                  <button
                    key={v.id}
                    className={`mode-switch__item${v.id === pianoVoicing ? " mode-switch__item--active" : ""}`}
                    onClick={() => setPianoVoicing(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {inferredKey && (
              <button
                className={`toggle-chip${showScale ? " toggle-chip--active" : ""}`}
                onClick={() => setShowScale((s) => !s)}
                aria-pressed={showScale}
              >
                <IconScale /> Scale
              </button>
            )}

            {hasVideo && (
              <button
                className={`toggle-chip${videoMode ? " toggle-chip--active" : ""}`}
                onClick={() => setVideoMode((v) => !v)}
                aria-pressed={videoMode}
              >
                {videoMode ? "Practice mode" : "Watch on YouTube"}
              </button>
            )}

            <button
              className="toggle-chip"
              onClick={() => setHelpOpen(true)}
              aria-haspopup="dialog"
              aria-label="Show keyboard shortcuts (?)"
            >
              <IconHelp /> Shortcuts
            </button>
          </div>

          <div className="player__settings-row">
            <div className="mode-switch mode-switch--voicing" role="group" aria-label="Practice level">
              {PRACTICE_LEVELS.map((l) => (
                <button
                  key={l.id}
                  className={`mode-switch__item${l.id === practiceLevel ? " mode-switch__item--active" : ""}`}
                  onClick={() => changePracticeLevel(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="mode-switch mode-switch--voicing" role="group" aria-label="Count-in">
              {COUNT_IN_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  className={`mode-switch__item${o.id === countInMeasures ? " mode-switch__item--active" : ""}`}
                  onClick={() => setCountInMeasures(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {capoSupported && capo > 0 && (
            <p className="settings-hint">
              Capo on fret {capo}: the chord name shows what sounds, the diagram shows the shape to finger.
            </p>
          )}

          {videoMode && hasVideo && (
            <div className="youtube-panel">
              {youtubeStatus === "error" ? (
                <div className="youtube-panel__error">
                  <p>{youtubeError ?? "This video can't be played here."}</p>
                  <button className="btn" onClick={() => setVideoMode(false)}>
                    Switch to practice mode
                  </button>
                </div>
              ) : (
                <>
                  <div className="youtube-embed">
                    <div ref={youtubeContainerRef} className="youtube-embed__iframe" />
                    {youtubeStatus === "loading" && <div className="youtube-embed__loading">Loading video…</div>}
                  </div>
                  <div className="youtube-sync">
                    <span>Sync offset: {syncOffset.toFixed(1)}s</span>
                    <button className="stepper-btn" onClick={() => adjustSyncOffset(-0.5)} aria-label="Nudge sync earlier">
                      −
                    </button>
                    <button className="stepper-btn" onClick={() => adjustSyncOffset(0.5)} aria-label="Nudge sync later">
                      +
                    </button>
                    {youtubeStatus === "ready" && supportsPlaybackRateControl(youtubeRates) && (
                      <select
                        className="speed-select"
                        onChange={(e) => setYoutubeRate(Number(e.target.value))}
                        defaultValue={1}
                        aria-label="Video playback speed"
                      >
                        {youtubeRates.map((r) => (
                          <option key={r} value={r}>
                            {r}x
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="settings-hint">
                    If the chords drift from the video, nudge the sync offset — hand-entered arrangements don't
                    always line up perfectly with a given upload.
                    {countInMeasures > 0 && " The count-in plays before the video starts, never over it."}
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="practice-stage">
        <div className="practice-stage__top">
          <span className="practice-stage__top-spacer" aria-hidden="true" />
          <span className="practice-stage__section-group">
            <span className="practice-stage__section">
              {countIn.active ? "Get ready" : currentSection?.name}
            </span>
            <EqualizerBars active={playing} />
          </span>
          <button
            className="practice-stage__focus-btn"
            onClick={onToggleFocusMode}
            aria-pressed={focusMode}
            aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            title={focusMode ? "Exit focus mode" : "Focus mode"}
          >
            <IconFocus />
          </button>
        </div>

        {countIn.active ? (
          <div className="count-in">
            <div className="count-in__number">{(countIn.step % beatsPerBar) + 1}</div>
            <BeatIndicator beatsPerBar={beatsPerBar} beat={countIn.step} playing />
          </div>
        ) : (
          <>
            <div className="practice-stage__main">
              <button
                className="nav-arrow"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex <= 0}
                aria-label="Previous chord"
              >
                <IconChevronLeft />
              </button>

              <div className="practice-stage__pair">
                <div className="practice-stage__current">
                  <div className="practice-stage__now" key={currentIndex}>
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
                        {currentDisplay.beginner?.kind === "simplified" && (
                          <div className="player__practice-note player__practice-note--simplified">
                            Beginner: simplified from {currentDisplay.original}
                          </div>
                        )}
                        {currentDisplay.beginner?.kind === "unavailable" && (
                          <div className="player__practice-note">No simpler beginner alternative for this chord</div>
                        )}
                        {advancedNotes && (
                          <div className="player__practice-note">
                            Notes: {advancedNotes.map((n) => NOTE_NAMES[n]).join(" · ")}
                          </div>
                        )}
                      </>
                    )}
                    {showDiagram && (
                      <ChordVisual
                        instrument={instrument}
                        chord={currentDisplay?.shapeChord ?? ""}
                        size={focusMode ? 260 : 220}
                        highlight
                        pianoVoicing={pianoVoicing}
                      />
                    )}
                  </div>
                  <BeatIndicator beatsPerBar={beatsPerBar} beat={beat} playing={playing} />
                </div>

                <div className="practice-stage__arrow" aria-hidden="true">
                  <IconChevronRight size={22} />
                </div>

                <div className="practice-stage__next">
                  <span className="practice-stage__next-label">
                    {willLoopToStart ? "Loops to" : "Next"}
                    {/* Beginner: less detail on screen at once — just "what's next", not the precise beat count. */}
                    {practiceLevel !== "beginner" && beatsToNext !== null
                      ? ` · in ${Math.max(1, Math.ceil(beatsToNext))} beat${Math.ceil(beatsToNext) === 1 ? "" : "s"}`
                      : ""}
                  </span>
                  <div className="practice-stage__next-content">
                    {nextEvent && nextDisplay ? (
                      showDiagram ? (
                        <ChordVisual
                          instrument={instrument}
                          chord={nextDisplay.shapeChord ?? ""}
                          size={focusMode ? 150 : 128}
                          pianoVoicing={pianoVoicing}
                        />
                      ) : (
                        <div className="player__chord-name player__chord-name--small">
                          {nextDisplay.unsupported ? "?" : nextDisplay.soundingChord}
                        </div>
                      )
                    ) : (
                      <div className="practice-stage__next-end">End of arrangement</div>
                    )}
                  </div>
                </div>
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

            {instrument !== "piano" && (
              <StrumGuide pattern={strumPattern} beatPosition={beat} playing={playing} />
            )}
          </>
        )}
      </div>

      {!focusMode && (
        <>
          <Timeline arrangement={arrangement} beat={beat} onSeek={seek} />
          {showScale && inferredKey && (
            <ScalePanel instrument={instrument} rootIndex={inferredKey.rootIndex} mode={inferredKey.mode} />
          )}
        </>
      )}

      <div className="transport-bar">
        <button
          className="btn btn--primary btn--icon-label"
          onClick={handlePlayPress}
          aria-label={playing ? "Pause (space)" : countIn.active ? "Cancel count-in (space)" : "Play (space)"}
        >
          {playing || countIn.active ? <IconPause /> : <IconPlay />}
          {countIn.active ? "Counting in…" : playing ? "Pause" : beat > 0 ? "Resume" : "Play"}
        </button>
        <button className="btn btn--icon" onClick={() => seek(0)} title="Restart" aria-label="Restart">
          <IconRestart />
        </button>
        {!videoActive && (
          <button
            className={`toggle-chip${clock.metronome ? " toggle-chip--active" : ""}`}
            onClick={() => clock.setMetronome(!clock.metronome)}
            aria-pressed={clock.metronome}
            aria-label={`Metronome (M)${clock.metronome ? ", on" : ", off"}`}
          >
            <IconMetronome /> Metronome
          </button>
        )}
        {!videoActive && (
          <button
            className={`toggle-chip${clock.loop ? " toggle-chip--active" : ""}`}
            onClick={() => clock.setLoop(!clock.loop)}
            aria-pressed={clock.loop}
            aria-label={`Loop (L)${clock.loop ? ", on" : ", off"}`}
          >
            <IconRepeat /> Loop
          </button>
        )}
      </div>

      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
