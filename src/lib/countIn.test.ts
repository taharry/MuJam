import { describe, expect, it, vi } from "vitest";
import { countInStepAt, isCountInFinished, planCountIn, scheduleCountInClicks } from "./countIn";

describe("planCountIn", () => {
  it("computes total steps from the song's actual beatsPerBar, not an assumed 4", () => {
    const waltz = planCountIn(0, 1, 3, 120, 1);
    expect(waltz.totalSteps).toBe(3);

    const commonTime = planCountIn(0, 1, 4, 120, 1);
    expect(commonTime.totalSteps).toBe(4);
  });

  it("scales step duration with bpm and speed", () => {
    const plan = planCountIn(0, 1, 4, 120, 1); // 120bpm -> 0.5s/beat
    expect(plan.stepSeconds).toBeCloseTo(0.5);

    const doubleSpeed = planCountIn(0, 1, 4, 120, 2);
    expect(doubleSpeed.stepSeconds).toBeCloseTo(0.25);
  });

  it("covers multiple measures", () => {
    const twoMeasures = planCountIn(0, 2, 4, 120, 1);
    expect(twoMeasures.totalSteps).toBe(8);
    expect(twoMeasures.endTime).toBeCloseTo(4); // 8 steps * 0.5s
  });

  it("treats a non-positive measure count as at least one measure", () => {
    const plan = planCountIn(0, 0, 4, 120, 1);
    expect(plan.totalSteps).toBe(4);
  });
});

describe("scheduleCountInClicks", () => {
  it("schedules exactly totalSteps clicks, accenting only the first beat of each measure", () => {
    const plan = planCountIn(10, 2, 4, 120, 1); // 2 measures of 4 -> 8 clicks
    const scheduler = { scheduleClick: vi.fn() };
    scheduleCountInClicks(plan, 4, scheduler);

    expect(scheduler.scheduleClick).toHaveBeenCalledTimes(8);
    const accents = scheduler.scheduleClick.mock.calls.map((c) => c[1]);
    expect(accents).toEqual([true, false, false, false, true, false, false, false]);
  });

  it("accents correctly for a 3/4 time signature", () => {
    const plan = planCountIn(0, 2, 3, 120, 1);
    const scheduler = { scheduleClick: vi.fn() };
    scheduleCountInClicks(plan, 3, scheduler);
    const accents = scheduler.scheduleClick.mock.calls.map((c) => c[1]);
    expect(accents).toEqual([true, false, false, true, false, false]);
  });

  it("schedules clicks at exact, evenly-spaced audio times with no gap or overlap", () => {
    const plan = planCountIn(5, 1, 4, 120, 1); // stepSeconds = 0.5
    const scheduler = { scheduleClick: vi.fn() };
    scheduleCountInClicks(plan, 4, scheduler);
    const times = scheduler.scheduleClick.mock.calls.map((c) => c[0]);
    expect(times).toEqual([5, 5.5, 6, 6.5]);
  });
});

describe("countInStepAt / isCountInFinished", () => {
  const plan = planCountIn(0, 1, 4, 120, 1); // 4 steps of 0.5s, ends at t=2

  it("reports null before the count-in starts", () => {
    expect(countInStepAt(plan, -0.1)).toBeNull();
  });

  it("reports the correct step throughout the count-in", () => {
    expect(countInStepAt(plan, 0)).toBe(0);
    expect(countInStepAt(plan, 0.4)).toBe(0);
    expect(countInStepAt(plan, 0.5)).toBe(1);
    expect(countInStepAt(plan, 1.9)).toBe(3);
  });

  it("reports null once finished, and isCountInFinished agrees", () => {
    expect(countInStepAt(plan, 2)).toBeNull();
    expect(isCountInFinished(plan, 1.999)).toBe(false);
    expect(isCountInFinished(plan, 2)).toBe(true);
  });
});
