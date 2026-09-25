import { useEffect, useRef, useState } from "react";
import { PlaybackClock } from "../lib/playbackClock";
import { AudioClickScheduler } from "../lib/metronome";

export interface UsePlaybackClockOptions {
  bpm: number;
  beatsPerBar: number;
  totalBeats: number;
}

// Wires the audio-clock-authoritative PlaybackClock into React: state
// (playing/speed/loop/metronome/beat) mirrors the clock, and a single
// requestAnimationFrame loop both asks the clock to schedule any
// upcoming metronome clicks and reads the current beat for rendering —
// the frame loop itself never accumulates time, it only samples it.
export function usePlaybackClock({ bpm, beatsPerBar, totalBeats }: UsePlaybackClockOptions) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [loop, setLoopState] = useState(true);
  const [metronome, setMetronomeState] = useState(true);
  const [beat, setBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const clockRef = useRef<PlaybackClock | null>(null);
  const rafRef = useRef<number | null>(null);

  // Created lazily on first real user interaction (play/seek), not
  // during render. Creating it eagerly during render used to work
  // "by accident" in production, but under StrictMode's dev-only
  // mount→unmount→remount cycle the unmount step's cleanup effect
  // would close the AudioContext right after it was created, and
  // because creation lived in the render body (which doesn't re-run
  // for that remount step) it was never recreated — leaving the clock
  // reading time from a closed, frozen context, so pressing Play
  // flipped the button but the beat position never actually advanced.
  function ensureClock(): PlaybackClock {
    if (audioCtxRef.current === null) {
      audioCtxRef.current = new AudioContext();
    }
    if (clockRef.current === null) {
      const ctx = audioCtxRef.current;
      const scheduler = new AudioClickScheduler(ctx);
      clockRef.current = new PlaybackClock(
        { now: () => ctx.currentTime, bpm, beatsPerBar, totalBeats, loop },
        scheduler
      );
      clockRef.current.setMetronomeEnabled(metronome);
    }
    return clockRef.current;
  }

  // Keep the clock's arrangement config current when the song/instrument changes.
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock) return;
    clock.updateArrangement(bpm, beatsPerBar, totalBeats);
    setBeat(clock.getBeat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, beatsPerBar, totalBeats]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  function runLoop() {
    const clock = clockRef.current;
    if (!clock) return;
    clock.tick();
    setBeat(clock.getBeat());
    if (clock.isFinished()) {
      clock.pause();
      setPlaying(false);
      setBeat(clock.getBeat());
      rafRef.current = null;
      return;
    }
    if (clock.isPlaying) {
      rafRef.current = requestAnimationFrame(runLoop);
    } else {
      rafRef.current = null;
    }
  }

  function play() {
    const clock = ensureClock();
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    clock.play();
    setPlaying(true);
    setBeat(clock.getBeat());
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(runLoop);
  }

  function pause() {
    const clock = clockRef.current;
    if (!clock) return;
    clock.pause();
    setPlaying(false);
    setBeat(clock.getBeat());
  }

  function toggle() {
    if (playing) pause();
    else play();
  }

  function seek(targetBeat: number) {
    const clock = ensureClock();
    clock.seek(targetBeat);
    setBeat(clock.getBeat());
  }

  function restart() {
    seek(0);
  }

  function setSpeed(next: number) {
    setSpeedState(next);
    const clock = clockRef.current;
    if (!clock) return;
    clock.setSpeed(next);
    setBeat(clock.getBeat());
  }

  function setLoop(next: boolean) {
    setLoopState(next);
    clockRef.current?.setLoop(next);
  }

  function setMetronome(next: boolean) {
    setMetronomeState(next);
    clockRef.current?.setMetronomeEnabled(next);
  }

  return { beat, playing, speed, loop, metronome, play, pause, toggle, seek, restart, setSpeed, setLoop, setMetronome };
}
