import type { ClickScheduler } from "./playbackClock";

// Schedules an oscillator to start at an exact future AudioContext time
// instead of firing immediately — this is what makes the click
// sample-accurate instead of being a little late every time, the way a
// click fired live from a setInterval callback always is.
export function playClickAt(ctx: AudioContext, when: number, accent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1200 : 800;
  gain.gain.setValueAtTime(0.15, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.08);
}

export class AudioClickScheduler implements ClickScheduler {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  scheduleClick(audioTime: number, accent: boolean) {
    playClickAt(this.ctx, audioTime, accent);
  }
}
