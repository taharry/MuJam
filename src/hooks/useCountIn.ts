import { useEffect, useRef, useState } from "react";
import { AudioClickScheduler } from "../lib/metronome";
import { countInStepAt, isCountInFinished, planCountIn, scheduleCountInClicks } from "../lib/countIn";

// Runs a one-shot count-in (its own short-lived AudioContext, separate
// from the main practice clock — they're sequential, never concurrent,
// so there's no need to share state with PlaybackClock) and calls
// `onDone` at the exact moment the last click's audio time has passed,
// which the caller uses to start the real playback (internal clock or
// an external video) from wherever it already was — never resetting
// the position count-in was requested from.
export function useCountIn() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, []);

  function cancel() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    setActive(false);
  }

  function start(measures: number, beatsPerBar: number, bpm: number, speed: number, onDone: () => void) {
    if (measures <= 0) {
      onDone();
      return;
    }
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const scheduler = new AudioClickScheduler(ctx);
    const plan = planCountIn(ctx.currentTime + 0.05, measures, beatsPerBar, bpm, speed);
    scheduleCountInClicks(plan, beatsPerBar, scheduler);

    setActive(true);
    setTotalSteps(plan.totalSteps);
    setStep(0);

    function loop() {
      if (!ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      if (isCountInFinished(plan, now)) {
        cancel();
        onDone();
        return;
      }
      const s = countInStepAt(plan, now);
      if (s !== null) setStep(s);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  return { active, step, totalSteps, start, cancel };
}
