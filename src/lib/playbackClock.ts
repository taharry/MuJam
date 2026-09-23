// Authoritative playback clock for internal practice mode. `setInterval`
// ticks drift and stall in background tabs, so instead this derives
// beat position from elapsed *audio-clock* time (injected via `now`,
// normally `AudioContext.currentTime`) relative to an anchor point that
// only moves on play/pause/seek/speed-change. Callers should render
// position from `getBeat()` on every animation frame — the frames
// themselves must never accumulate time, only read it.
//
// Metronome clicks are scheduled ahead of time (`tick()` looks a short
// window into the future and hands off exact audio times to a
// `ClickScheduler`), following the standard "schedule slightly ahead of
// the audio clock" pattern needed for sample-accurate timing — a click
// fired from a live callback is always a little late.

export interface ClickScheduler {
  scheduleClick(audioTime: number, accent: boolean): void;
}

export interface PlaybackClockConfig {
  /** Authoritative time source, in seconds. Normally `() => audioCtx.currentTime`. */
  now: () => number;
  bpm: number;
  beatsPerBar: number;
  totalBeats: number;
  loop: boolean;
}

const LOOKAHEAD_SEC = 0.1;

export class PlaybackClock {
  private config: PlaybackClockConfig;
  private scheduler?: ClickScheduler;
  private speed = 1;
  private playing = false;
  private metronomeEnabled = true;
  private anchorTime = 0;
  private anchorBeat = 0;
  /** Next (unwrapped, ever-increasing) absolute beat index to schedule a click for. */
  private nextClickBeatIndex = 0;

  constructor(config: PlaybackClockConfig, scheduler?: ClickScheduler) {
    this.config = config;
    this.scheduler = scheduler;
  }

  private secPerBeat(): number {
    return 60 / this.config.bpm / this.speed;
  }

  /** Raw, unwrapped beat position — keeps counting past totalBeats even while looping. */
  private rawBeat(): number {
    if (!this.playing) return this.anchorBeat;
    const elapsed = this.config.now() - this.anchorTime;
    return this.anchorBeat + elapsed / this.secPerBeat();
  }

  /** Beat position for display/lookup: wrapped into [0, totalBeats) when looping, clamped at the end otherwise. */
  getBeat(): number {
    const raw = this.rawBeat();
    const total = this.config.totalBeats;
    if (total <= 0) return 0;
    if (raw >= total) {
      if (this.config.loop) return raw % total;
      return total - 1e-6;
    }
    return raw;
  }

  isFinished(): boolean {
    return !this.config.loop && this.rawBeat() >= this.config.totalBeats;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentSpeed(): number {
    return this.speed;
  }

  private resetAnchor(beat: number) {
    this.anchorBeat = beat;
    this.anchorTime = this.config.now();
    this.nextClickBeatIndex = Math.ceil(beat - 1e-9);
  }

  play() {
    if (this.playing) return;
    let beat = this.getBeat();
    if (!this.config.loop && beat >= this.config.totalBeats - 1e-6) beat = 0;
    this.playing = true;
    this.resetAnchor(beat);
  }

  pause() {
    if (!this.playing) return;
    const beat = this.getBeat();
    this.playing = false;
    this.anchorBeat = beat;
  }

  seek(beat: number) {
    const total = this.config.totalBeats;
    const clamped = total > 0 ? Math.max(0, Math.min(total - 1e-6, beat)) : 0;
    if (this.playing) {
      this.resetAnchor(clamped);
    } else {
      this.anchorBeat = clamped;
    }
  }

  setSpeed(speed: number) {
    if (speed <= 0) return;
    const beat = this.getBeat();
    this.speed = speed;
    if (this.playing) this.resetAnchor(beat);
    else this.anchorBeat = beat;
  }

  setMetronomeEnabled(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  setLoop(loop: boolean) {
    this.config = { ...this.config, loop };
  }

  updateArrangement(bpm: number, beatsPerBar: number, totalBeats: number) {
    const beat = this.getBeat();
    this.config = { ...this.config, bpm, beatsPerBar, totalBeats };
    if (this.playing) this.resetAnchor(Math.min(beat, Math.max(totalBeats - 1e-6, 0)));
    else this.anchorBeat = Math.min(beat, Math.max(totalBeats - 1e-6, 0));
  }

  /** Call periodically (e.g. every ~25ms) while playing to schedule any clicks that fall within the lookahead window. */
  tick() {
    if (!this.playing || !this.scheduler) return;
    const now = this.config.now();
    const horizon = now + LOOKAHEAD_SEC;
    const { totalBeats, loop, beatsPerBar } = this.config;
    if (totalBeats <= 0) return;

    while (true) {
      if (!loop && this.nextClickBeatIndex >= totalBeats) break;
      const t = this.anchorTime + (this.nextClickBeatIndex - this.anchorBeat) * this.secPerBeat();
      if (t > horizon) break;
      if (t >= now && this.metronomeEnabled) {
        const beatInSong = loop ? (((this.nextClickBeatIndex % totalBeats) + totalBeats) % totalBeats) : this.nextClickBeatIndex;
        const beatInBar = ((Math.round(beatInSong) % beatsPerBar) + beatsPerBar) % beatsPerBar;
        this.scheduler.scheduleClick(t, beatInBar === 0);
      }
      // else: this click's moment already passed (e.g. the tab was
      // backgrounded) — skip it silently rather than bursting out every
      // missed click at once when we catch back up.
      this.nextClickBeatIndex += 1;
    }
  }
}
