// Pure count-in timing — separate from any AudioContext/React so the
// schedule math (how many clicks, when, which are accented) is fully
// unit-testable, following the same split used for the main playback
// clock (lib/playbackClock.ts) and metronome (lib/metronome.ts).

export interface CountInScheduler {
  scheduleClick(audioTime: number, accent: boolean): void;
}

export interface CountInPlan {
  totalSteps: number;
  stepSeconds: number;
  startTime: number;
  endTime: number;
}

// Reads the song's actual time signature (beatsPerBar) rather than
// assuming 4 — a waltz gets a 3-beat count-in per measure, not 4.
export function planCountIn(
  now: number,
  measures: number,
  beatsPerBar: number,
  bpm: number,
  speed: number
): CountInPlan {
  const totalSteps = Math.max(1, Math.round(measures)) * beatsPerBar;
  const stepSeconds = 60 / bpm / speed;
  return { totalSteps, stepSeconds, startTime: now, endTime: now + totalSteps * stepSeconds };
}

export function scheduleCountInClicks(plan: CountInPlan, beatsPerBar: number, scheduler: CountInScheduler): void {
  for (let i = 0; i < plan.totalSteps; i++) {
    scheduler.scheduleClick(plan.startTime + i * plan.stepSeconds, i % beatsPerBar === 0);
  }
}

/** 0-indexed step currently sounding, or null if `now` falls outside the count-in window. */
export function countInStepAt(plan: CountInPlan, now: number): number | null {
  if (now < plan.startTime || now >= plan.endTime) return null;
  return Math.min(plan.totalSteps - 1, Math.floor((now - plan.startTime) / plan.stepSeconds));
}

export function isCountInFinished(plan: CountInPlan, now: number): boolean {
  return now >= plan.endTime;
}
