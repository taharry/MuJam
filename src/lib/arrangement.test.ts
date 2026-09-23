import { describe, expect, it } from "vitest";
import { ArrangementError, buildArrangement, clampBeat, findActiveEventIndex, findActiveSection } from "./arrangement";

describe("buildArrangement", () => {
  it("flattens sequential sections into beat-indexed events", () => {
    const arr = buildArrangement({
      bpm: 100,
      beatsPerBar: 4,
      sections: [
        { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
        { name: "Chorus", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
      ],
    });

    expect(arr.source).toBe("simplified");
    expect(arr.totalBeats).toBe(16);
    expect(arr.events).toEqual([
      { chord: "C", startBeat: 0, durationBeats: 4, sectionIndex: 0 },
      { chord: "G", startBeat: 4, durationBeats: 4, sectionIndex: 0 },
      { chord: "Am", startBeat: 8, durationBeats: 4, sectionIndex: 1 },
      { chord: "F", startBeat: 12, durationBeats: 4, sectionIndex: 1 },
    ]);
    expect(arr.sections).toEqual([
      { name: "Verse", startBeat: 0, durationBeats: 8 },
      { name: "Chorus", startBeat: 8, durationBeats: 8 },
    ]);
  });

  it("marks explicitly verified arrangements as such", () => {
    const arr = buildArrangement({
      source: "verified",
      bpm: 120,
      beatsPerBar: 4,
      sections: [{ name: "Intro", chords: [{ chord: "C", beats: 4 }] }],
    });
    expect(arr.source).toBe("verified");
  });

  it("expands a repeat count without requiring duplicated data", () => {
    const arr = buildArrangement({
      bpm: 100,
      beatsPerBar: 4,
      sections: [{ name: "Chorus", chords: [{ chord: "C", beats: 4 }], repeat: 3 }],
    });
    expect(arr.sections).toHaveLength(3);
    expect(arr.sections.map((s) => s.startBeat)).toEqual([0, 4, 8]);
    expect(arr.totalBeats).toBe(12);
  });

  it("resolves a section that references an earlier one by id", () => {
    const arr = buildArrangement({
      bpm: 100,
      beatsPerBar: 4,
      sections: [
        { id: "verse-1", name: "Verse 1", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
        { name: "Chorus", chords: [{ chord: "Am", beats: 4 }] },
        { name: "Verse 2", ref: "verse-1" },
      ],
    });
    const verse2 = arr.sections[2];
    expect(verse2.name).toBe("Verse 2");
    const verse2Events = arr.events.filter((e) => e.startBeat >= verse2.startBeat);
    expect(verse2Events.map((e) => e.chord)).toEqual(["C", "G"]);
  });

  it("supports explicit startBeat for hand-placed syncopation", () => {
    const arr = buildArrangement({
      bpm: 100,
      beatsPerBar: 4,
      sections: [
        { name: "Verse", chords: [{ chord: "C", beats: 2, startBeat: 0 }, { chord: "G", beats: 2, startBeat: 2 }] },
      ],
    });
    expect(arr.events[1].startBeat).toBe(2);
  });

  it("rejects a reference to an unknown or forward section id", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [{ name: "Verse 2", ref: "does-not-exist" }],
      })
    ).toThrow(ArrangementError);
  });

  it("rejects a missing chord name", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [{ name: "Verse", chords: [{ chord: "", beats: 4 }] }],
      })
    ).toThrow(ArrangementError);
  });

  it("rejects a non-positive duration", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [{ name: "Verse", chords: [{ chord: "C", beats: 0 }] }],
      })
    ).toThrow(ArrangementError);
  });

  it("rejects an invalid repeat count", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [{ name: "Verse", chords: [{ chord: "C", beats: 4 }], repeat: 0 }],
      })
    ).toThrow(ArrangementError);
  });

  it("rejects overlapping explicit event placements", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [
          {
            name: "Verse",
            chords: [
              { chord: "C", beats: 4, startBeat: 0 },
              { chord: "G", beats: 4, startBeat: 2 },
            ],
          },
        ],
      })
    ).toThrow(ArrangementError);
  });

  it("rejects a declared duration that conflicts with the computed length", () => {
    expect(() =>
      buildArrangement({
        bpm: 100,
        beatsPerBar: 4,
        sections: [{ name: "Verse", chords: [{ chord: "C", beats: 4 }] }],
        expectedTotalBeats: 8,
      })
    ).toThrow(ArrangementError);
  });
});

describe("findActiveEventIndex / findActiveSection", () => {
  const arr = buildArrangement({
    bpm: 100,
    beatsPerBar: 4,
    sections: [
      { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
      { name: "Chorus", chords: [{ chord: "Am", beats: 4 }] },
    ],
  });

  it("finds the event containing a beat position", () => {
    expect(findActiveEventIndex(arr.events, 0)).toBe(0);
    expect(findActiveEventIndex(arr.events, 3.99)).toBe(0);
    expect(findActiveEventIndex(arr.events, 4)).toBe(1);
    expect(findActiveEventIndex(arr.events, 100)).toBe(-1);
  });

  it("finds the section containing a beat position", () => {
    expect(findActiveSection(arr.sections, 5)?.name).toBe("Verse");
    expect(findActiveSection(arr.sections, 8)?.name).toBe("Chorus");
  });
});

describe("clampBeat", () => {
  it("clamps within [0, totalBeats)", () => {
    expect(clampBeat(-5, 16)).toBe(0);
    expect(clampBeat(5, 16)).toBe(5);
    expect(clampBeat(100, 16)).toBeLessThan(16);
  });

  it("returns 0 for a degenerate zero-length arrangement", () => {
    expect(clampBeat(5, 0)).toBe(0);
  });
});
