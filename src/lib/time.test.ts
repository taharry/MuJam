import { describe, expect, it } from "vitest";
import { beatsToSeconds, secondsPerBeat, secondsToBeats } from "./time";

describe("beat/second conversion", () => {
  it("converts beats to seconds at a given bpm", () => {
    expect(beatsToSeconds(60, 60)).toBeCloseTo(60);
    expect(beatsToSeconds(4, 120)).toBeCloseTo(2);
  });

  it("speed scales real time but not the beat count itself", () => {
    expect(beatsToSeconds(4, 120, 2)).toBeCloseTo(1); // 2x speed halves the time
    expect(beatsToSeconds(4, 120, 0.5)).toBeCloseTo(4); // half speed doubles the time
  });

  it("round-trips seconds back to the original beat count", () => {
    const beats = 7.5;
    const bpm = 96;
    const speed = 1.25;
    const seconds = beatsToSeconds(beats, bpm, speed);
    expect(secondsToBeats(seconds, bpm, speed)).toBeCloseTo(beats);
  });

  it("secondsPerBeat matches 60/bpm/speed", () => {
    expect(secondsPerBeat(120)).toBeCloseTo(0.5);
    expect(secondsPerBeat(120, 2)).toBeCloseTo(0.25);
  });
});
