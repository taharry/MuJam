import { describe, expect, it } from "vitest";
import { activeStrumStepIndex, getGenreStrumPattern, resolveStrumPattern } from "./strum";

describe("getGenreStrumPattern", () => {
  it("picks a waltz feel for 3/4", () => {
    expect(getGenreStrumPattern("pop", 3).cycleBeats).toBe(3);
  });

  it("picks reggae skank for reggae in 4/4", () => {
    const p = getGenreStrumPattern("reggae", 4);
    expect(p.steps.every((s) => s.stroke !== "down")).toBe(true);
  });

  it("falls back to a generic pattern for an unusual meter", () => {
    const p = getGenreStrumPattern("pop", 7);
    expect(p.cycleBeats).toBe(7);
    expect(p.steps).toHaveLength(14);
  });
});

describe("resolveStrumPattern", () => {
  it("prefers a song-specific pattern over the genre default", () => {
    const songPattern = getGenreStrumPattern("funk", 4);
    const resolved = resolveStrumPattern({ songPattern, genre: "pop", beatsPerBar: 4 });
    expect(resolved.source).toBe("song");
  });

  it("falls back to the genre pattern when no song pattern is given", () => {
    const resolved = resolveStrumPattern({ genre: "reggae", beatsPerBar: 4 });
    expect(resolved.source).toBe("genre");
  });
});

describe("activeStrumStepIndex", () => {
  const pattern = getGenreStrumPattern("pop", 4); // 8 eighth-note steps over 4 beats

  it("finds the step at the start of a cycle", () => {
    expect(activeStrumStepIndex(pattern, 0)).toBe(0);
  });

  it("finds the step mid-cycle", () => {
    expect(activeStrumStepIndex(pattern, 1)).toBe(2); // beat 1 = step index 2 (2 steps/beat)
  });

  it("stays aligned after seeking into a later cycle (wraps by cycleBeats)", () => {
    // beat 9 is cycle 2 (beats 8-12), 1 beat in -> same step as beat 1
    expect(activeStrumStepIndex(pattern, 9)).toBe(activeStrumStepIndex(pattern, 1));
  });

  it("handles a non-integer beat position between steps", () => {
    // 0.25 beats in is between step 0 (beat 0) and step 1 (beat 0.5)
    expect(activeStrumStepIndex(pattern, 0.25)).toBe(0);
  });
});
