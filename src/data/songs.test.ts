import { describe, expect, it } from "vitest";
import { SONGS, getArrangement } from "./songs";

describe("getArrangement compatibility adapter", () => {
  it("builds a valid, simplified arrangement for every catalog song", () => {
    for (const song of SONGS) {
      const arr = getArrangement(song);
      expect(arr.source).toBe("simplified");
      expect(arr.events.length).toBeGreaterThan(0);
      expect(arr.totalBeats).toBeGreaterThan(0);
    }
  });

  it("marks a song with a verifiedArrangement as verified and flattens it", () => {
    const song = {
      ...SONGS[0],
      sections: [{ name: "Verse", chords: [{ chord: "C", beats: 4 }] }],
      verifiedArrangement: {
        sections: [
          { name: "Intro", chords: [{ chord: "C", beats: 4 }] },
          { name: "Verse", chords: [{ chord: "G", beats: 4 }] },
        ],
      },
    };
    const arr = getArrangement(song);
    expect(arr.source).toBe("verified");
    expect(arr.sections.map((s) => s.name)).toEqual(["Intro", "Verse"]);
  });
});
