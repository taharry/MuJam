import { describe, expect, it, vi } from "vitest";
import { PlaybackClock } from "./playbackClock";

function makeClock(overrides: Partial<{ bpm: number; beatsPerBar: number; totalBeats: number; loop: boolean }> = {}) {
  let time = 0;
  const scheduler = { scheduleClick: vi.fn() };
  const clock = new PlaybackClock(
    {
      now: () => time,
      bpm: 60, // 1 beat per second, easy to reason about
      beatsPerBar: 4,
      totalBeats: 16,
      loop: true,
      ...overrides,
    },
    scheduler
  );
  return { clock, scheduler, advance: (sec: number) => (time += sec) };
}

describe("PlaybackClock: basic position tracking", () => {
  it("starts at beat 0 while not playing", () => {
    const { clock } = makeClock();
    expect(clock.getBeat()).toBe(0);
  });

  it("advances one beat per second at 60bpm", () => {
    const { clock, advance } = makeClock();
    clock.play();
    advance(2.5);
    expect(clock.getBeat()).toBeCloseTo(2.5);
  });

  it("freezes position on pause and resumes from there, not from zero", () => {
    const { clock, advance } = makeClock();
    clock.play();
    advance(3);
    clock.pause();
    advance(10); // time passes while paused — must not move the beat
    expect(clock.getBeat()).toBeCloseTo(3);
    clock.play();
    advance(1);
    expect(clock.getBeat()).toBeCloseTo(4);
  });
});

describe("PlaybackClock: seek", () => {
  it("seeking while paused repositions immediately", () => {
    const { clock } = makeClock();
    clock.seek(6);
    expect(clock.getBeat()).toBeCloseTo(6);
  });

  it("seeking while playing continues advancing from the new position", () => {
    const { clock, advance } = makeClock();
    clock.play();
    advance(2);
    clock.seek(10);
    expect(clock.getBeat()).toBeCloseTo(10);
    advance(1.5);
    expect(clock.getBeat()).toBeCloseTo(11.5);
  });

  it("clamps a seek beyond the end of the arrangement", () => {
    const { clock } = makeClock({ totalBeats: 16 });
    clock.seek(999);
    expect(clock.getBeat()).toBeLessThan(16);
  });
});

describe("PlaybackClock: speed changes", () => {
  it("preserves the current beat position exactly at the moment speed changes", () => {
    const { clock, advance } = makeClock();
    clock.play();
    advance(4);
    expect(clock.getBeat()).toBeCloseTo(4);
    clock.setSpeed(2);
    expect(clock.getBeat()).toBeCloseTo(4);
  });

  it("applies the new speed to subsequent playback, not stored beat positions", () => {
    const { clock, advance } = makeClock();
    clock.play();
    advance(4);
    clock.setSpeed(2); // double speed -> 2 beats/sec from here
    advance(1);
    expect(clock.getBeat()).toBeCloseTo(6);
  });
});

describe("PlaybackClock: looping", () => {
  it("wraps position into [0, totalBeats) when looping", () => {
    const { clock, advance } = makeClock({ totalBeats: 8, loop: true });
    clock.play();
    advance(10); // 2 full loops + 2 beats
    expect(clock.getBeat()).toBeCloseTo(2);
  });

  it("clamps at the end and reports finished when not looping", () => {
    const { clock, advance } = makeClock({ totalBeats: 8, loop: false });
    clock.play();
    advance(20);
    expect(clock.getBeat()).toBeLessThan(8);
    expect(clock.isFinished()).toBe(true);
  });
});

describe("PlaybackClock: metronome scheduling", () => {
  it("schedules a click for each beat with the correct accent on beat 1", () => {
    const { clock, scheduler, advance } = makeClock({ totalBeats: 16, beatsPerBar: 4, loop: true });
    clock.play();
    clock.tick(); // schedules beat 0 (accented) within the lookahead window
    advance(0.05);
    clock.tick();
    const calls = scheduler.scheduleClick.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][1]).toBe(true); // beat 0 is the downbeat
  });

  it("does not schedule the same beat twice across repeated tick() calls", () => {
    const { clock, scheduler, advance } = makeClock({ totalBeats: 16, loop: true });
    clock.play();
    for (let i = 0; i < 50; i++) {
      clock.tick();
      advance(0.02);
    }
    const times = scheduler.scheduleClick.mock.calls.map((c) => c[0]);
    const unique = new Set(times);
    expect(unique.size).toBe(times.length);
  });

  it("schedules clicks continuously across a loop boundary with no gap or duplicate", () => {
    const { clock, scheduler, advance } = makeClock({ totalBeats: 4, beatsPerBar: 4, loop: true });
    clock.play();
    for (let i = 0; i < 400; i++) {
      clock.tick();
      advance(0.02);
    }
    const times = [...scheduler.scheduleClick.mock.calls.map((c) => c[0])].sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeCloseTo(1, 1); // 1 second per beat at 60bpm
    }
  });

  it("does not burst-schedule stale clicks after a long gap without ticking (e.g. backgrounded tab)", () => {
    const { clock, scheduler, advance } = makeClock({ totalBeats: 100, loop: false });
    clock.play();
    clock.tick(); // legitimately schedules only beat 0, right at t=0
    scheduler.scheduleClick.mockClear();
    advance(30); // 30 seconds pass with no tick() calls in between — beats 1-29 are now in the past
    clock.tick();
    // None of the missed beats (1-29) should be retroactively scheduled at once.
    const staleCalls = scheduler.scheduleClick.mock.calls.filter((c) => c[0] > 0 && c[0] < 30);
    expect(staleCalls).toHaveLength(0);
    // The catch-up tick should pick back up right around "now".
    expect(scheduler.scheduleClick.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
